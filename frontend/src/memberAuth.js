export const setMemberAuth = (token, member) => {
  localStorage.setItem("member_token", token);
  localStorage.setItem("member_data", JSON.stringify(member));
};

export const getMember = () => {
  try {
    const raw = localStorage.getItem("member_data");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const memberLogout = () => {
  localStorage.removeItem("member_token");
  localStorage.removeItem("member_data");
};

export const isMemberLoggedIn = () => !!localStorage.getItem("member_token");
