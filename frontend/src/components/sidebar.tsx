/* dependencies */
import React from "react";
import { Icon } from "./elements";
import Breadcrumb from "./breadcrumb";
// import { socketURL } from "../helpers"
import translate from "../helpers/translator";
import { Link } from "react-router-dom";
import { ApplicationContext } from "../context";
import { array } from "fast-web-kit";
import getMenu from "../helpers/menu/";
import { getInfo, text } from "../helpers";

/* menu */
export type menu = {
  rank: number;
  icon: string;
  link: string;
  title: string;
  visible: boolean;
  subMenu?: subMenu[];
  hasSubMenu?: boolean;
};

/* sub menu */
export type subMenu = {
  title: string;
  link: string;
  visible: boolean;
};

/* sidebar */
const Sidebar: React.FunctionComponent = React.memo(() => {
  // getting application variable
  const { application } = React.useContext(ApplicationContext);

  // const userLanguage = storage.retrieve("language")
  const [activeLink, setActiveLink] = React.useState<string>(
    window.location.pathname
  );
  const [activMenu, setActiveMenu] = React.useState<number>(-1);
  const [icon, setIcon] = React.useState<string>("dashboard");
  const [title, setTitle] = React.useState<string>("dashboard");
  // const [activeLanguage, setActiveLanguage] = React.useState<"swahili" | "english">(userLanguage ? userLanguage : "english")

  window.onclick = (event: any): void => {
    // getting current pathname
    const currentPathname: string = window.location.pathname;

    // changing active nav link
    setActiveLink(currentPathname);

    // update breadcrumb
    updateBreadcrumb();

    // close active sidebar content
    if (
      event.target.tagName !== "A" &&
      event.target.tagName !== "SPAN" &&
      event.target.tagName !== "I"
    )
      setActiveMenu(-1);
  };

  // update breadcrumb
  function updateBreadcrumb(): void {
    const currentPathname: string = window.location.pathname;
    // eslint-disable-next-line
    getMenu().map((menu: menu) => {
      if (
        currentPathname.includes(menu.title.replace(/ /g, "-").toLowerCase())
      ) {
        setTitle(menu.title);
        setIcon(menu.icon);
      }
    });
  }

  React.useEffect(() => {
    updateBreadcrumb();
    // eslint-disable-next-line
  }, []);

  // function for toggling sidebar content
  const toggleSidebarContent = (index: number): void => {
    // toggle sibar nav content
    if (index === activMenu) setActiveMenu(-1);
    else setActiveMenu(index);
  };

  // function for rendering menu
  const renderMenu = React.useCallback(() => {
    return array
      .sort(getMenu(), "asc", "rank")
      .map((menu: menu, index: number) => {
        if (menu.visible)
          return (
            <li
              className="nav-item"
              key={index}
              onClick={() => {
                toggleSidebarContent(index);
                if (!menu.hasSubMenu) {
                  application.unMount();
                  application.closeSidebar();
                }
              }}>
              <Link
                to={menu.link}
                className={`nav-link ${
                  activeLink.includes(`/${menu.title.toLowerCase()}/`)
                    ? "active"
                    : ""
                }`}>
                <Icon type="rounded" name={menu.icon} />
                <span>{translate(menu.title)}</span>
              </Link>
              {menu.hasSubMenu && menu.subMenu ? (
                <ul
                  className={`nav-content ${
                    activMenu === index ? "show" : ""
                  }`}>
                  {menu.subMenu
                    .sort((a, b) => {
                      if (a.title.length < b.title.length) {
                        return -1;
                      }
                      if (a.title.length > b.title.length) {
                        return 1;
                      }
                      return 0;
                    })
                    .map((subMenu: subMenu, indexTwo: number) => {
                      if (subMenu.visible)
                        return (
                          <li key={indexTwo}>
                            <Link
                              to={subMenu.link}
                              className={`${
                                activeLink.includes(subMenu.link)
                                  ? "active"
                                  : ""
                              }`}
                              onClick={() => {
                                application.unMount();
                                application.closeSidebar();
                              }}>
                              <Icon name="chevron_right" type="rounded" />
                              <span>{translate(subMenu.title)}</span>
                            </Link>
                          </li>
                        );
                      else return null;
                    })}
                </ul>
              ) : null}
            </li>
          );
        else return null;
      });
    // eslint-disable-next-line
  }, [activeLink, activMenu]);

  // returning component view
  if (application.state.authenticated)
    return (
      <>
        <Breadcrumb
          icon={icon}
          title={title}
          toggleSidebar={application.toggleSidebar}
          authenticate={application.authenticate}
        />
        <aside id="sidebar" className="sidebar hide-on-print">
          <Icon
            name="menu_open"
            type="rounded toggle-sidebar-btn"
            onClick={application.toggleSidebar}
          />
          <Link to="/profile/edit" className="logo-container">
            <Icon name="person" type="rounded" />
            <div className="username">
              {text.reFormat(getInfo("user", "username"))}
            </div>
          </Link>
          <ul className="sidebar-nav" id="sidebar-nav">
            {renderMenu()}
            <li className="nav-item">
              <Link
                to="#"
                className="nav-link"
                onClick={() => application.authenticate("logout")}>
                <Icon name="logout" type="rounded" />
                <span>{translate("Logout")}</span>
              </Link>
            </li>
          </ul>
          <div
            id="overlay"
            className="overlay"
            onClick={application.toggleSidebar}></div>
        </aside>
      </>
    );
  return null;
});

/* exporting component */
export default Sidebar;
