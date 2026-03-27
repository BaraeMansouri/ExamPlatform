import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const echoEnabled = import.meta.env.VITE_ENABLE_ECHO === "true";

if (echoEnabled) {
  window.Echo = new Echo({
    broadcaster: "pusher",
    key: import.meta.env.VITE_PUSHER_APP_KEY || "local",
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || "mt1",
    wsHost: import.meta.env.VITE_PUSHER_HOST || "127.0.0.1",
    wsPort: Number(import.meta.env.VITE_PUSHER_PORT || 6001),
    forceTLS: false,
    enabledTransports: ["ws", "wss"],
    authEndpoint: "http://127.0.0.1:8000/broadcasting/auth",
    auth: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        Accept: "application/json",
      },
    },
  });
} else {
  window.Echo = null;
}
