import { Brand, PageHeader } from "@patternfly/react-core";
import environment from "./environment";
export const Header = () => {
  const logo = environment.logo ? environment.logo : "/SIMA23.svg";

  return (
    <PageHeader
      showNavToggle
      logo={
        <Brand
          src={environment.resourceUrl + logo}
          id="masthead-logo"
          alt="Logo"
          className="keycloak__pageheader_brand"
        />
      }
      logoComponent="div"
    />
  );
};
