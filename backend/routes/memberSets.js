// routes/memberSets.js
import express from "express";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = express.Router();

/**
 * Helper: check if requester can access a member
 * Agent: member.sponsor_id === agent.id
 * Owner: member.sponsor_id === owner.id OR sponsor is one of owner's agents
 */
async function canAccessMember(user, memberId) {
  // fetch member sponsor
  const m = await pool.query(`SELECT id, sponsor_id FROM members WHERE id = $1`, [memberId]);
  const member = m.rows[0];
  if (!member) return { ok: false, reason: "Member not found" };

  // agent can access only their sponsored members
  if (user.role === "agent") {
    if (member.sponsor_id !== user.id) return { ok: false, reason: "Not allowed for this member" };
    return { ok: true, member };
  }

  // ✅ owner can access ANY member
  if (user.role === "owner") return { ok: true, member };

  return { ok: false, reason: "Not allowed for this member" };
}

/**
 * Assign set to member
 * Rule: Only ONE active set per member
 */
router.post("/assign", auth, allowRoles("owner", "agent"), async (req, res) => {
  const client = await pool.connect();
  try {
    const { member_id, set_id } = req.body;

    if (!member_id || !set_id) {
      return res.status(400).json({ message: "member_id and set_id required" });
    }

    // Permission: must be your member (agent) or your/agent member (owner)
    const perm = await canAccessMember(req.user, Number(member_id));
    if (!perm.ok) return res.status(403).json({ message: perm.reason });

    // Ensure set exists
    const s = await pool.query(`SELECT id FROM sets WHERE id = $1`, [Number(set_id)]);
    if (s.rowCount === 0) return res.status(404).json({ message: "Set not found" });

    await client.query("BEGIN");

    // Check active set for that member
    const existing = await client.query(
      `SELECT id FROM member_sets WHERE member_id = $1 AND status = 'active' LIMIT 1`,
      [Number(member_id)]
    );

    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Member already has an active set" });
    }

    const r = await client.query(
      `INSERT INTO member_sets (member_id, set_id, assigned_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [Number(member_id), Number(set_id), req.user.id]
    );

    await client.query("COMMIT");
    res.status(201).json(r.rows[0]);
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

/**
 * List assigned sets
 * Includes:
 * - total_tasks (actual count in set)
 * - set_amount (sum of task prices)
 * - current_task_amount (price of current task based on current_task_index)
 * - status computed (completed if current_task_index >= total_tasks)
 *
 * Agent: only their sponsored members
 * Owner: their sponsored members + their agents' sponsored members
 */
router.get("/", auth, allowRoles("owner", "agent"), async (req, res) => {
  try {
    const params = [];
    let whereSql = "";

    if (req.user.role === "agent") {
      params.push(req.user.id);
      whereSql = `WHERE m.sponsor_id = $1`;
    } else {
      // owner
      params.push(req.user.id);
      whereSql = `
        WHERE
          m.sponsor_id = $1
          OR m.sponsor_id IN (
            SELECT id FROM users WHERE created_by = $1 AND role = 'agent'
          )
      `;
    }

    /**
     * We calculate:
     * total_tasks: COUNT(tasks)
     * set_amount : SUM(tasks.price)
     * current_task_amount : price of task at position (current_task_index + 1) ordered by set_tasks.id
     */
const q = `
  WITH set_task_rows AS (
    SELECT
      st.id AS set_task_id,
      st.set_id,
      st.task_id,
      ROW_NUMBER() OVER (PARTITION BY st.set_id ORDER BY st.position ASC, st.id ASC) AS rn
    FROM set_tasks st
  ),

  assignment_amounts AS (
    SELECT
      ms.id AS member_set_id,
      COUNT(str.task_id)::int AS total_tasks,
      COALESCE(SUM(t.rate * COALESCE(msto.quantity_override, t.quantity)), 0)::numeric(12,2) AS set_amount,
      COALESCE(
        SUM((t.rate * COALESCE(msto.quantity_override, t.quantity)) * (t.commission_rate / 100.0)),
        0
      )::numeric(12,2) AS set_commission
    FROM member_sets ms
    LEFT JOIN set_task_rows str ON str.set_id = ms.set_id
    LEFT JOIN tasks t ON t.id = str.task_id
    LEFT JOIN member_set_task_overrides msto
      ON msto.member_set_id = ms.id
     AND msto.set_task_id = str.set_task_id
    GROUP BY ms.id
  ),

  current_task_calc AS (
    SELECT
      ms.id AS member_set_id,
      COALESCE(t.rate * COALESCE(msto.quantity_override, t.quantity), 0)::numeric(12,2) AS current_task_amount,
      COALESCE(
        (t.rate * COALESCE(msto.quantity_override, t.quantity)) * (t.commission_rate / 100.0),
        0
      )::numeric(12,2) AS current_task_commission
    FROM member_sets ms
    LEFT JOIN set_task_rows str
      ON str.set_id = ms.set_id
     AND str.rn = (ms.current_task_index + 1)
    LEFT JOIN tasks t ON t.id = str.task_id
    LEFT JOIN member_set_task_overrides msto
      ON msto.member_set_id = ms.id
     AND msto.set_task_id = str.set_task_id
  )

  SELECT
    ms.id,
    ms.current_task_index,
    ms.created_at,
    ms.updated_at,

    m.id AS member_id,
    m.short_id AS member_short_id,
    m.nickname AS member_nickname,
    m.phone AS member_phone,

    s.id AS set_id,
    s.name AS set_name,
    s.max_tasks,

    COALESCE(aa.total_tasks, 0) AS total_tasks,
    COALESCE(aa.set_amount, 0)::numeric(12,2) AS set_amount,
    COALESCE(aa.set_commission, 0)::numeric(12,2) AS set_commission,

    COALESCE(ct.current_task_amount, 0)::numeric(12,2) AS current_task_amount,
    COALESCE(ct.current_task_commission, 0)::numeric(12,2) AS current_task_commission,

    CASE
      WHEN ms.current_task_index >= COALESCE(aa.total_tasks, 0) AND COALESCE(aa.total_tasks, 0) > 0
        THEN 'completed'
      ELSE ms.status
    END AS status

  FROM member_sets ms
  JOIN members m ON m.id = ms.member_id
  JOIN sets s ON s.id = ms.set_id
  LEFT JOIN assignment_amounts aa ON aa.member_set_id = ms.id
  LEFT JOIN current_task_calc ct ON ct.member_set_id = ms.id

  ${whereSql}
  ORDER BY ms.created_at DESC
`;

    const r = await pool.query(q, params);
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:memberSetId/tasks", auth, allowRoles("owner", "agent"), async (req, res) => {
  const memberSetId = Number(req.params.memberSetId);
  if (!Number.isFinite(memberSetId)) return res.status(400).json({ message: "Invalid memberSetId" });

  // load assignment
  const msR = await pool.query(
    `SELECT id, member_id, set_id, status, current_task_index FROM member_sets WHERE id = $1`,
    [memberSetId]
  );
  const ms = msR.rows[0];
  if (!ms) return res.status(404).json({ message: "Assignment not found" });

  // permission: same rule you already use
  const perm = await canAccessMember(req.user, ms.member_id);
  if (!perm.ok) return res.status(403).json({ message: perm.reason });

const r = await pool.query(
  `
  SELECT
    st.id AS set_task_id,
    st.position,
    t.id AS task_id,
    t.title,
    t.rate,
    t.price,
    t.quantity AS base_quantity,
    t.commission_rate,
    msto.quantity_override,
    COALESCE(msto.quantity_override, t.quantity) AS quantity_effective,

    (t.rate * COALESCE(msto.quantity_override, t.quantity))::numeric(12,2) AS task_amount,
    ((t.rate * COALESCE(msto.quantity_override, t.quantity)) * (t.commission_rate / 100.0))::numeric(12,2) AS task_commission
  FROM set_tasks st
  JOIN tasks t ON t.id = st.task_id
  LEFT JOIN member_set_task_overrides msto
    ON msto.member_set_id = $1
   AND msto.set_task_id = st.id
  WHERE st.set_id = $2
  ORDER BY st.position ASC, st.id ASC
  `,
  [memberSetId, ms.set_id]
);

  res.json({
    member_set_id: ms.id,
    status: ms.status,
    current_task_index: ms.current_task_index,
    rows: r.rows,
  });
});

router.put("/:memberSetId/tasks/:setTaskId/quantity", auth, allowRoles("owner", "agent"), async (req, res) => {
  const memberSetId = Number(req.params.memberSetId);
  const setTaskId = Number(req.params.setTaskId);
  const quantity = Number(req.body?.quantity);

  if (!Number.isFinite(memberSetId) || !Number.isFinite(setTaskId)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  if (!Number.isFinite(quantity) || quantity < 1) {
    return res.status(400).json({ message: "quantity must be >= 1" });
  }

  const msR = await pool.query(
    `SELECT id, member_id, set_id, status, current_task_index FROM member_sets WHERE id = $1`,
    [memberSetId]
  );
  const ms = msR.rows[0];
  if (!ms) return res.status(404).json({ message: "Assignment not found" });

  // ✅ IMPORTANT safety: only allow edits while active AND before progress (recommended)
  if (String(ms.status).toLowerCase() !== "active") {
    return res.status(400).json({ message: "Only active assignments can be edited" });
  }
  if (Number(ms.current_task_index || 0) > 0) {
    return res.status(400).json({ message: "Cannot edit quantity after tasks have started" });
  }

  const perm = await canAccessMember(req.user, ms.member_id);
  if (!perm.ok) return res.status(403).json({ message: perm.reason });

  // ensure setTaskId belongs to this set
  const stR = await pool.query(`SELECT id FROM set_tasks WHERE id = $1 AND set_id = $2`, [setTaskId, ms.set_id]);
  if (stR.rowCount === 0) return res.status(404).json({ message: "Task not in this set" });

  const up = await pool.query(
    `
    INSERT INTO member_set_task_overrides (member_set_id, set_task_id, quantity_override)
    VALUES ($1, $2, $3)
    ON CONFLICT (member_set_id, set_task_id)
    DO UPDATE SET quantity_override = EXCLUDED.quantity_override, updated_at = now()
    RETURNING *
    `,
    [memberSetId, setTaskId, quantity]
  );

  res.json({ ok: true, override: up.rows[0] });
});

router.delete("/:memberSetId/tasks/:setTaskId/quantity", auth, allowRoles("owner", "agent"), async (req, res) => {
  const memberSetId = Number(req.params.memberSetId);
  const setTaskId = Number(req.params.setTaskId);

  await pool.query(
    `DELETE FROM member_set_task_overrides WHERE member_set_id = $1 AND set_task_id = $2`,
    [memberSetId, setTaskId]
  );
  res.json({ ok: true });
});

export default router;
