var deferredPrompt;
var enableNotificationButtons = document.querySelectorAll('.enable-notifications');

if (!window.Promise) {
    window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker
            .register('/service-worker.js')
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

function displayConfirmNotification() {
    if ('serviceWorker' in navigator) {
        var options = {
            body: 'You successfully subscribed to our notification service',
            icon: '/src/images/icons/app-icon-96x96.png',
            image: '/src/images/sf-boat.jpg',
            dir: 'ltr',
            lang: 'en-GB',
            vibrate: [100, 50, 200],
            badge: '/src/images/icons/app-icon-96x96.png',
            tag: 'confirm-notification',
            renotify: true,
            actions: [
                { action: 'confirm', title: 'OK', icon: '/src/images/icons/app-icon-96x96.png' },
                { action: 'cancel', title: 'Cancel', icon: '/src/images/icons/app-icon-96x96.png' }
            ]
        };
        navigator.serviceWorker.ready
            .then(function(swreg) {
                swreg.showNotification('Successfully Subscribed!', options);
            });
    }
    // new Notification('Successfully Subscribed!', options);
}

function configurePushSub() {
    if (!('serviceWorker' in navigator)) { return; }

    var reg;
    navigator.serviceWorker.ready
        .then(function(swreg) {
            reg = swreg;
            return swreg.pushManager.getSubscription();
        })
        .then(function(sub) {
            if (sub === null) {
                var convertedVapidPublicKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
                return reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidPublicKey
                });
            }
        })
        .then(function(newSub) {
            return fetch(DATABASE_URL + 'subscriptions.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(newSub)
            });
        })
        .then(function(res) {
            if (res.ok) {
                displayConfirmNotification();
            }
        })
        .catch(function(err) {
            console.error(err);
        });
}

function askForNotificationPermission() {
    Notification.requestPermission()
        .then(function(result) {
            console.log('User choice:', result);
            // for (var i = 0; i < enableNotificationButtons.length; i ++) {
            //     enableNotificationButtons[i].style.display = 'none';
            // }
            if (result !== 'granted') {
                console.log('No notification granted');
            } else {
                configurePushSub();
            }
        });
}

if ('Notification' in window && 'serviceWorker' in navigator) {
    for (var i = 0; i < enableNotificationButtons.length; i ++) {
        enableNotificationButtons[i].style.display = 'inline-block';
        enableNotificationButtons[i].addEventListener('click', askForNotificationPermission);
    }
}
