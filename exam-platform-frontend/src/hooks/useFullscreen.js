import { useEffect, useState } from 'react';

export const useFullscreen = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const checkFullscreen = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };

    useEffect(() => {
        document.addEventListener('fullscreenchange', checkFullscreen);

        return () => {
            document.removeEventListener('fullscreenchange', checkFullscreen);
        };
    }, []);

    const requestFullscreen = async () => {
        try {
            await document.documentElement.requestFullscreen();
        } catch (error) {
            console.error("Fullscreen error:", error);
        }
    };

    const exitFullscreen = async () => {
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.error("Exit fullscreen error:", error);
        }
    };

    return { isFullscreen, requestFullscreen, exitFullscreen };
};