var deferredPrompt;

if (!window.Promise) {
    window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker
            .register('/sw.js')
            .then(function() {
                console.log('Service worker registered');
            })
            .catch(function(err) {
                console.log(err);
            });
}

// function unregisterSW() {
//     if ('serviceWorker' in navigator) {
//         navigator.serviceWorker.getRegistrations()
//             .then(function(registrations) {
//                 for (var i = 0; i < registrations.length; i++) {
//                     registrations[i].unregister();
//                 }
//             });
//     }
// }

window.addEventListener('beforeinstallprompt', function(event) {
    console.log('beforeinstallprompt fired');
    event.preventDefault();
    deferredPrompt = event;
    return false;
});
