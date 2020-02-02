var deferredPrompt;
var enableNotificationButtons = document.querySelectorAll('.enable-notifications');

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

function displayConfirmNotification() {
    if ('serviceWorker' in navigator) {
        var options = {
            body: 'You successfully subscribed to our notification service'
        };
        navigator.serviceWorker.ready
            .then(function(swreg) {
                swreg.showNotification('Successfully Subscribed (via SW)!', options);
            });
    }
    // new Notification('Successfully Subscribed!', options);
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
                displayConfirmNotification();
            }
        });
}

if ('Notification' in window) {
    for (var i = 0; i < enableNotificationButtons.length; i ++) {
        enableNotificationButtons[i].style.display = 'inline-block';
        enableNotificationButtons[i].addEventListener('click', askForNotificationPermission);
    }
}
