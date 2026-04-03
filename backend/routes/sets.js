import express from "express";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";
import { setCreateSchema, setTaskAddSchema } from "../validators.js";

const router = express.Router();

router.post("/", auth, allowRoles("owner", "agent"), async (req, res) => {
  const parsed = setCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });

  const { name, max_tasks } = parsed.data;

  const r = await pool.query(
    `INSERT INTO sets (name, max_tasks, created_by)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, max_tasks, req.user.id]
  );
  res.status(201).json(r.rows[0]);
});

router.get("/", auth, allowRoles("owner", "agent"), async (req, res) => {
  const r = await pool.query(
    `SELECT *
     FROM sets
     WHERE is_archived = false
     ORDER BY id DESC`
  );
  res.json(r.rows);
});

router.get("/:id/tasks", auth, allowRoles("owner", "agent"), async (req, res) => {
  const setId = Number(req.params.id);
  if (!Number.isFinite(setId)) return res.status(400).json({ message: "Invalid set id" });

  const r = await pool.query(
    `SELECT st.id as set_task_id, st.position, t.*
     FROM set_tasks st
     JOIN tasks t ON t.id = st.task_id
     WHERE st.set_id = $1
     ORDER BY st.position ASC, st.id ASC`,
    [setId]
  );

  res.json(r.rows);
});

router.post("/:id/tasks", auth, allowRoles("owner", "agent"), async (req, res) => {
  const setId = Number(req.params.id);
  if (!Number.isFinite(setId)) return res.status(400).json({ message: "Invalid set id" });

  const parsed = setTaskAddSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });

  const { task_id } = parsed.data;

  const setR = await pool.query("SELECT id, max_tasks FROM sets WHERE id = $1", [setId]);
  const set = setR.rows[0];
  if (!set) return res.status(404).json({ message: "Set not found" });

  const countR = await pool.query("SELECT COUNT(*)::int AS c FROM set_tasks WHERE set_id = $1", [setId]);
  if (countR.rows[0].c >= set.max_tasks) {
    return res.status(400).json({ message: "Set is full (max tasks reached)" });
  }

  try {
    const posR = await pool.query(
      "SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM set_tasks WHERE set_id = $1",
      [setId]
    );
    const nextPos = Number(posR.rows[0].next_pos || 1);

    const r = await pool.query(
      `INSERT INTO set_tasks (set_id, task_id, position)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [setId, task_id, nextPos]
    );    
    res.status(201).json(r.rows[0]);
  } catch (e) {
    if (String(e).includes("set_tasks_set_id_task_id_key")) {
      return res.status(409).json({ message: "Task already in this set" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:setId/tasks/:taskId/move", auth, allowRoles("owner", "agent"), async (req, res) => {
  const setId = Number(req.params.setId);
  const taskId = Number(req.params.taskId);
  const toPos = Number(req.body?.to_position);

  if (!Number.isFinite(setId) || !Number.isFinite(taskId)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  if (!Number.isFinite(toPos) || toPos < 1) {
    return res.status(400).json({ message: "to_position must be >= 1" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const countR = await client.query(
      "SELECT COUNT(*)::int AS c FROM set_tasks WHERE set_id = $1",
      [setId]
    );
    const count = countR.rows[0].c;
    if (count === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Set is empty" });
    }

    const newPos = Math.min(toPos, count);

    // ✅ lock all rows in this set to avoid concurrent move collisions
    await client.query("SELECT id FROM set_tasks WHERE set_id = $1 FOR UPDATE", [setId]);

    const curR = await client.query(
      "SELECT position FROM set_tasks WHERE set_id = $1 AND task_id = $2",
      [setId, taskId]
    );
    const cur = curR.rows[0];
    if (!cur) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Task not in set" });
    }

    const fromPos = Number(cur.position || 1);
    if (fromPos === newPos) {
      await client.query("COMMIT");
      return res.json({ ok: true, position: newPos });
    }

    // ✅ move the target task to a safe temporary position (negative is OK in your schema)
    const tempPos = -1000000 - taskId;
    await client.query(
      "UPDATE set_tasks SET position = $1 WHERE set_id = $2 AND task_id = $3",
      [tempPos, setId, taskId]
    );

    if (newPos < fromPos) {
      // move up: shift [newPos .. fromPos-1] down (+1) safely using negatives
      await client.query(
        `UPDATE set_tasks
         SET position = -(position + 1)
         WHERE set_id = $1
           AND position >= $2
           AND position < $3`,
        [setId, newPos, fromPos]
      );

      await client.query(
        `UPDATE set_tasks
         SET position = -position
         WHERE set_id = $1
           AND position < 0`,
        [setId]
      );
    } else {
      // move down: shift [fromPos+1 .. newPos] up (-1) safely using negatives
      await client.query(
        `UPDATE set_tasks
         SET position = -(position - 1)
         WHERE set_id = $1
           AND position > $2
           AND position <= $3`,
        [setId, fromPos, newPos]
      );

      await client.query(
        `UPDATE set_tasks
         SET position = -position
         WHERE set_id = $1
           AND position < 0`,
        [setId]
      );
    }

    // place task into desired position
    await client.query(
      "UPDATE set_tasks SET position = $1 WHERE set_id = $2 AND task_id = $3",
      [newPos, setId, taskId]
    );

    await client.query("COMMIT");
    res.json({ ok: true, position: newPos });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("MOVE ERROR:", e);

    res.status(500).json({
      message: "Server error",
      pg: {
        code: e?.code,
        detail: e?.detail,
        constraint: e?.constraint,
        table: e?.table,
      },
    });
  } finally {
    client.release();
  }
});

router.delete("/:setId/tasks/:taskId", auth, allowRoles("owner", "agent"), async (req, res) => {
  const setId = Number(req.params.setId);
  const taskId = Number(req.params.taskId);
  if (!Number.isFinite(setId) || !Number.isFinite(taskId)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      "DELETE FROM set_tasks WHERE set_id = $1 AND task_id = $2",
      [setId, taskId]
    );

    await client.query(
      `
      WITH ordered AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY position ASC, id ASC) AS rn
        FROM set_tasks
        WHERE set_id = $1
      )
      UPDATE set_tasks st
      SET position = -ordered.rn
      FROM ordered
      WHERE st.id = ordered.id
      `,
      [setId]
    );

    await client.query(
      `
      UPDATE set_tasks
      SET position = -position
      WHERE set_id = $1
        AND position < 0
      `,
      [setId]
    );

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("REMOVE TASK ERROR:", e);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

router.get("/:id/delete-preview", auth, allowRoles("owner", "agent"), async (req, res) => {
  const setId = Number(req.params.id);
  if (!Number.isFinite(setId)) return res.status(400).json({ message: "Invalid set id" });

  const whereSql =
    req.user.role === "agent"
      ? "s.id = $1 AND s.created_by = $2"
      : "s.id = $1";
  const params = req.user.role === "agent" ? [setId, req.user.id] : [setId];

  const setR = await pool.query(`SELECT s.id, s.name, s.max_tasks, s.is_archived FROM sets s WHERE ${whereSql}`, params);
  const set = setR.rows[0];
  if (!set) return res.status(404).json({ message: "Set not found or not allowed" });

  const r = await pool.query(
    `
    SELECT
      ms.id AS member_set_id,
      ms.member_id,
      m.short_id,
      m.nickname,
      ms.status,
      ms.current_task_index,
      ms.updated_at
    FROM member_sets ms
    JOIN members m ON m.id = ms.member_id
    WHERE ms.set_id = $1
    ORDER BY ms.updated_at DESC, ms.id DESC
    `,
    [setId]
  );

  const assigned = r.rows;
  const active = assigned.filter(x => String(x.status).toLowerCase() === "active");

  res.json({
    set,
    assigned_count: assigned.length,
    active_count: active.length,
    active_members: active.map(x => ({
      member_id: x.member_id,
      short_id: x.short_id,
      nickname: x.nickname,
      member_set_id: x.member_set_id,
      current_task_index: x.current_task_index,
      status: x.status,
    })),
  });
});


router.delete("/:id", auth, allowRoles("owner", "agent"), async (req, res) => {
  const setId = Number(req.params.id);
  const force = String(req.query.force || "").toLowerCase() === "true";

  if (!Number.isFinite(setId)) {
    return res.status(400).json({ message: "Invalid set id" });
  }

  const whereSql =
    req.user.role === "agent"
      ? "id = $1 AND created_by = $2"
      : "id = $1";

  const params =
    req.user.role === "agent" ? [setId, req.user.id] : [setId];

  const setR = await pool.query(`SELECT id, is_archived FROM sets WHERE ${whereSql}`, params);
  const set = setR.rows[0];
  if (!set) return res.status(404).json({ message: "Set not found or not allowed" });
  if (set.is_archived) return res.json({ ok: true, already_archived: true });

  // check usage
  const assignedR = await pool.query(
    `
    SELECT ms.id AS member_set_id, ms.member_id, m.short_id, m.nickname, ms.status, ms.current_task_index
    FROM member_sets ms
    JOIN members m ON m.id = ms.member_id
    WHERE ms.set_id = $1
    ORDER BY ms.updated_at DESC, ms.id DESC
    `,
    [setId]
  );

  const assigned = assignedR.rows;
  const active = assigned.filter(x => String(x.status).toLowerCase() === "active");

  // ✅ never used -> HARD DELETE
  if (assigned.length === 0) {
    const del = await pool.query(`DELETE FROM sets WHERE ${whereSql} RETURNING id`, params);
    if (!del.rowCount) return res.status(404).json({ message: "Set not found or not allowed" });
    return res.json({ ok: true, deleted: true });
  }

  // ✅ used -> require confirmation first
  if (!force) {
    return res.status(400).json({
      message: "This set has been used. It will be archived (not deleted). Confirm?",
      assigned_count: assigned.length,
      active_count: active.length,
      active_members: active.map(x => ({
        member_id: x.member_id,
        short_id: x.short_id,
        nickname: x.nickname,
        member_set_id: x.member_set_id,
        current_task_index: x.current_task_index,
        status: x.status,
      })),
    });
  }

  // ✅ force=true -> ARCHIVE (and optionally stop active)
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // optional: stop currently running assignments so nobody continues after archive
    await client.query(
      `UPDATE member_sets
       SET status = 'stopped', updated_at = now()
       WHERE set_id = $1 AND status = 'active'`,
      [setId]
    );

    await client.query(
      `UPDATE sets
       SET is_archived = true,
           archived_at = now(),
           archived_by = $2
       WHERE id = $1`,
      [setId, req.user.id]
    );

    await client.query("COMMIT");
    res.json({ ok: true, archived: true, assigned_count: assigned.length, active_count: active.length });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("ARCHIVE SET ERROR:", e);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

export default router;
