import { useEffect, useRef } from 'react';

export const useAntiCheat = (onViolation) => {
    const timeoutRef = useRef(null);

    useEffect(() => {
        const trigger = (type, level, message) => {
            onViolation(type, level, message);
        };

        const handleVisibility = () => {
            if (document.hidden) {
                trigger('tab_change', 'danger', 'Tab changé');
            }
        };

        const prevent = (e, type, message) => {
            e.preventDefault();
            trigger(type, 'warning', message);
        };

        const handleMouseLeave = (e) => {
            if (e.clientY <= 0) {
                timeoutRef.current = setTimeout(() => {
                    trigger('mouse_leave', 'danger', 'Sortie écran');
                }, 1000);
            }
        };

        const handleMouseEnter = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };

        const handleKeyDown = (e) => {
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.key === 'U')
            ) {
                e.preventDefault();
                trigger('devtools', 'danger', 'DevTools détecté');
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        document.addEventListener('copy', (e) => prevent(e, 'copy', 'Copy interdit'));
        document.addEventListener('paste', (e) => prevent(e, 'paste', 'Paste interdit'));
        document.addEventListener('contextmenu', (e) => prevent(e, 'context', 'Clic droit'));
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleMouseEnter);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleMouseEnter);
            document.removeEventListener('keydown', handleKeyDown);

            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [onViolation]);
};