import { useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { motion, MotionConfig } from 'motion/react';

export interface AdminDockItem {
    section: string;
    label: string;
    icon: string;
}

/**
 * Spring physics matching the DropdownReact component family — the shared
 * motion language of the app's navigation components.
 */
const DOCK_SPRING = { type: 'spring', stiffness: 320, damping: 28, mass: 0.9 } as const;

export function AdminDock({
    items,
    active,
    onSelect,
}: {
    items: AdminDockItem[];
    active: string;
    onSelect: (section: string) => void;
}) {
    return (
        <MotionConfig transition={DOCK_SPRING}>
            <nav className="ap-dock" aria-label="Admin Navigation">
                {items.map((item) => {
                    const isActive = item.section === active;
                    return (
                        <motion.button
                            key={item.section}
                            type="button"
                            className={`ap-dock-btn ${isActive ? 'is-active' : ''}`}
                            onClick={() => onSelect(item.section)}
                            whileTap={{ scale: 0.9 }}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            {isActive && (
                                <motion.span
                                    className="ap-dock-pill"
                                    layoutId="ap-dock-active-pill"
                                    transition={DOCK_SPRING}
                                />
                            )}
                            <span className="ap-dock-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: item.icon }} />
                            <span className="ap-dock-label">{item.label}</span>
                        </motion.button>
                    );
                })}
            </nav>
        </MotionConfig>
    );
}

/**
 * Mounts the spring-physics dock into its `.admin-dock-host` element.
 * The host carries `data-active`; section changes are broadcast through the
 * `ap-dock:section` CustomEvent so the pill springs between tabs.
 */
export function mountAdminDock(container: HTMLElement, onSelect: (section: string) => void) {
    const host = container.querySelector<HTMLElement>('.admin-dock-host');
    if (!host) return;
    const itemsScript = host.querySelector('[data-dock-items]');
    if (!itemsScript) return;

    let items: AdminDockItem[] = [];
    try {
        items = JSON.parse(itemsScript.textContent || '[]') as AdminDockItem[];
    } catch (error) {
        console.error('Admin dock items could not be loaded.', error);
        return;
    }
    itemsScript.remove();
    if (items.length === 0) return;

    const initialActive = host.dataset.active || items[0].section;

    const AdminDockApp = () => {
        const [active, setActive] = useState(initialActive);

        useEffect(() => {
            const onSection = (event: Event) => {
                const detail = (event as CustomEvent<string>).detail;
                if (detail) setActive(detail);
            };
            host.addEventListener('ap-dock:section', onSection);
            return () => host.removeEventListener('ap-dock:section', onSection);
        }, []);

        return (
            <AdminDock
                items={items}
                active={active}
                onSelect={(section) => {
                    host.dispatchEvent(new CustomEvent('ap-dock:section', { detail: section }));
                    onSelect(section);
                }}
            />
        );
    };

    const root: Root = createRoot(host);
    root.render(<AdminDockApp />);
}
