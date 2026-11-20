import Storefront from "./features/storefront/Storefront";
import { AccountPages } from "./features/identity/AccountPages";
export default function App() {
  const path = window.location.pathname.replace(/\/$/, "");
  if (/^\/(account|seller)(\/|$)/.test(path))
    return <AccountPages path={path} />;
  return <Storefront />;
}
