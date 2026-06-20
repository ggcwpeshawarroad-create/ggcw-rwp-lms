export const formatText = (text: string) => {
  if (!text) return "";
  return text.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export const formatRole = (role: string) => {
  if (!role) return "";
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};
