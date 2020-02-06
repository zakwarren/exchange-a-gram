const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const webpush = require('web-push');
const formidable = require('formidable');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const UUID = require('uuid-v4');

const serviceAccount = require('./key.json');
const constants = require('./constants');

const gcConfig = {
    projectId: constants.projectId,
    keyFilename: 'key.json'
};
const gcs = new Storage(gcConfig);

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: constants.databaseURL
});

exports.storePostData = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        const uuid = UUID();
        const formData = new formidable.IncomingForm();
        formData.parse((request, err, fields, files) => {
            fs.rename(files.file.path, '/tmp/' + files.file.name);
            const bucket = gcs.bucket(constants.storage_bucket);

            bucket.upload('/tmp/' + files.file.name, {
                uploadType: 'media',
                metadata: {
                    metadata: {
                        contentType: files.file.type,
                        firebaseStorageDownloadTokens: uuid
                    }
                }
            }, (err, file) => {
                if (!err) {

                    admin.database().ref('posts').push({
                        id: fields.id,
                        title: fields.title,
                        location: fields.location,
                        image: 'https://firebasestorage.googleapis.com/v0/b/'
                                    + bucket.name
                                    + '/o/'
                                    + encodeURIComponent(file.name)
                                    + '?alt=media&token='
                                    + uuid
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
                                content: 'New post created',
                                openUrl: '/help'
                            }))
                            .catch(err => console.log(err));
                        });
            
                        return response.status(201).json({
                            message: 'Data stored',
                            id: fields.id
                        });
                    })
                    .catch(err => {
                        return response.status(500).json({
                            error: err
                        });
                    });

                } else {
                    console.log(err);
                }
            });
        });
    });
});
