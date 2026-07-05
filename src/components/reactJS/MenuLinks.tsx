import React from 'react';
import { RiHome5Line, RiToolsFill, RiUser3Line, RiCodeSSlashLine, RiBriefcase2Line, RiMailLine } from 'react-icons/ri';

interface MenuLinksProps {
    namepage?: string;
    pathname: string;
}

interface IconLink {
    icon: React.ReactNode;
    href: string;
    label: string;
}

const MenuLinks: React.FC<MenuLinksProps> = ({ namepage, pathname }) => {
    const getIconLinks = (): IconLink[] => {
        let iconLinks: IconLink[] = [];

        if (namepage === "home") {
            iconLinks = [
                {
                    icon: <RiHome5Line size={20} />,
                    href: "#hero_home",
                    label: "Accueil"
                },
                {
                    icon: <RiToolsFill size={20} />,
                    href: "#skills",
                    label: "Compétences"
                },
                {
                    icon: <RiUser3Line size={20} />,
                    href: "#about",
                    label: "À propos"
                },
                {
                    icon: <RiCodeSSlashLine size={20} />,
                    href: "#service",
                    label: "Services"
                },
                {
                    icon: <RiBriefcase2Line size={20} />,
                    href: "#work",
                    label: "Travaux"
                },
                {
                    icon: <RiMailLine size={20} />,
                    href: "#contact",
                    label: "Contact"
                }
            ];
        } else if (namepage === "blog") {
            iconLinks = [
                {
                    icon: <RiHome5Line size={20} />,
                    href: "/#hero_home",
                    label: "Accueil"
                },
                {
                    icon: <RiToolsFill size={20} />,
                    href: "/#skills",
                    label: "Compétences"
                },
                {
                    icon: <RiUser3Line size={20} />,
                    href: "/#about",
                    label: "À propos"
                },
                {
                    icon: <RiCodeSSlashLine size={20} />,
                    href: "/#service",
                    label: "Services"
                },
                {
                    icon: <RiBriefcase2Line size={20} />,
                    href: "/#work",
                    label: "Travaux"
                },
                {
                    icon: <RiMailLine size={20} />,
                    href: "/#contact",
                    label: "Contact"
                }
            ];
        } else if (namepage === "work") {
            iconLinks = [
                {
                    icon: <RiHome5Line size={20} />,
                    href: "/#hero_home",
                    label: "Accueil"
                },
                {
                    icon: <RiToolsFill size={20} />,
                    href: "/#skills",
                    label: "Compétences"
                },
                {
                    icon: <RiUser3Line size={20} />,
                    href: "/#about",
                    label: "À propos"
                },
                {
                    icon: <RiCodeSSlashLine size={20} />,
                    href: "/#service",
                    label: "Services"
                },
                {
                    icon: <RiBriefcase2Line size={20} />,
                    href: "#work",
                    label: "Travaux"
                },
                {
                    icon: <RiMailLine size={20} />,
                    href: "#contact",

                    label: "Contact"
                }
            ];
        } else if (namepage === "widgetCss") {
            iconLinks = [
                {
                    icon: <RiHome5Line size={20} />,
                    href: "/#hero_home",
                    label: "Accueil"
                },
                {
                    icon: <RiToolsFill size={20} />,
                    href: "/#skills",
                    label: "Compétences"
                },
                {
                    icon: <RiUser3Line size={20} />,
                    href: "/#about",
                    label: "À propos"
                },
                {
                    icon: <RiCodeSSlashLine size={20} />,
                    href: "/#service",
                    label: "Services"
                },
                {
                    icon: <RiBriefcase2Line size={20} />,
                    href: "/#work",
                    label: "Travaux"
                },
                {
                    icon: <RiMailLine size={20} />,
                    href: "/#contact",
                    label: "Contact"
                }
            ];
        }

        return iconLinks;
    };

    return (
        <ul className="menu-links-container">
            {getIconLinks().map(({ href, icon, label }) => (
                <li key={href}>
                    <a
                        aria-current={pathname === href}
                        href={href}
                        className={`menu-link-item ${pathname === href ? 'active' : ''}`}
                        title={label}
                    >
                        {icon}
                    </a>
                </li>
            ))}
        </ul>
    );
};

export default MenuLinks;
