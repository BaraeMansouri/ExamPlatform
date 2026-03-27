import { useState, useEffect } from 'react';

export const useTimer = (initialMinutes, onExpire) => {
    const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);

    useEffect(() => {
        if (secondsLeft <= 0) {
            onExpire();
            return;
        }

        const interval = setInterval(() => {
            setSecondsLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [secondsLeft, onExpire]);

    const formatTime = () => {
        const hrs = Math.floor(secondsLeft / 3600);
        const mins = Math.floor((secondsLeft % 3600) / 60);
        const secs = secondsLeft % 60;

        return hrs > 0
            ? `${hrs.toString().padStart(2, '0')}:${mins
                  .toString()
                  .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
            : `${mins.toString().padStart(2, '0')}:${secs
                  .toString()
                  .padStart(2, '0')}`;
    };

    return { secondsLeft, formattedTime: formatTime() };
};