const pathname = window.location.pathname;
const [, , realm] = pathname.split("/");

const newPathName = `/realms/${realm}/account/password`;

if (window.location.pathname !== newPathName)
  window.location.pathname = `realms/${realm}/account/password`;
