const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const webpush = require('web-push');
const serviceAccount = require('./key.json');
const constants = require('./constants');

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: constants.databaseURL
});

exports.storePostData = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        admin.database().ref('posts').push({
            id: request.body.id,
            title: request.body.title,
            location: request.body.location,
            image: request.body.image
        })
        .then(() => {
            webpush.setVapidDetails(
                'mailto:' + constants.email,
                constants.webPushPublicKey,
                constants.webPushPrivateKey
            );
            return admin.database().ref('subscriptions').once('value');
        })
        .then(subscriptions => {
            subscriptions.forEach(sub => {
                const pushConfig = {
                    endpoint: sub.val().endpoint,
                    keys: {
                        auth: sub.val().keys.auth,
                        p256dh: sub.val().keys.p256dh
                    }
                };

                webpush.sendNotification(pushConfig, JSON.stringify({
                    title: 'New Post',
                    content: 'New post created'
                }))
                .catch(err => console.log(err));
            });

            return response.status(201).json({
                message: 'Data stored',
                id: request.body.id
            });
        })
        .catch(err => {
            return response.status(500).json({
                error: err
            });
        })
    });
});
