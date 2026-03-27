import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Axios config
window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Pusher config
window.Pusher = Pusher;

// Echo config
window.Echo = new Echo({
    broadcaster: "pusher",
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true, // ⚠️ obligatoire avec Pusher cloud
});