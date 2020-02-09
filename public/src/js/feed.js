var CACHE_USER_NAME = 'user-requested';

var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');
var snackbarContainer = document.querySelector('#confirmation-toast');
var videoPlayer = document.querySelector('#player');
var canvasElement = document.querySelector('#canvas');
var captureBtn = document.querySelector('#capture-btn');
var imagePicker = document.querySelector('#image-picker');
var imagePickerArea = document.querySelector('#pick-image');
var picture;
var locationBtn = document.querySelector('#location-btn');
var locationLoader = document.querySelector('#location-loader');
var manualLocation = document.querySelector('#manual-location');
var fetchedLocation;

locationBtn.addEventListener('click', function(event) {
    if (!('geolocation' in navigator)) {
        return;
    }

    locationBtn.style.display = 'none';
    locationLoader.style.display = 'block';

    navigator.geolocation.getCurrentPosition(function(position) {
        locationBtn.style.display = 'inline';
        locationLoader.style.display = 'none';
        fetchedLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        locationInput.value = 'Lat: ' + fetchedLocation.lat + ' | Long: ' + fetchedLocation.lng;
        manualLocation.classList.add('is-focused');
    }, function(err) {
        console.log(err);
        locationBtn.style.display = 'inline';
        locationLoader.style.display = 'none';
        fetchedLocation = { lat: null, lng: null };
        alert('Couldn\'t find location, please enter manually');
    }, { timeout: 7000 });
});

if (!('geolocation' in navigator)) {
    locationBtn.style.display = 'none';
}

if (!('mediaDevices' in navigator)) {
    navigator.mediaDevices = {};
}

if (!('getUserMedia' in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
        var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        if (!getUserMedia) {
            return Promise.reject(new Error('getUserMedia is not implemented'));
        }

        return new Promise(function(resolve, reject) {
            getUserMedia.call(navigator, constraints, resolve, reject);
        });
    }
}

function initializeMedia() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function(stream) {
            videoPlayer.srcObject = stream;
            videoPlayer.style.display = 'block';
        })
        .catch(function(err) {
            imagePickerArea.style.display = 'block';
            captureBtn.style.display = 'none';
        });
}

captureBtn.addEventListener('click', function(event) {
    canvasElement.style.display = 'block';
    videoPlayer.style.display = 'none';
    captureBtn.style.display = 'none';

    var context = canvasElement.getContext('2d');
    context.drawImage(
        videoPlayer,
        0,
        0,
        canvasElement.width,
        videoPlayer.videoHeight / (videoPlayer.videoWidth / canvasElement.width)
    );
    videoPlayer.srcObject.getVideoTracks().forEach(function(track) {
        track.stop();
    });
    picture = dataURItoBlob(canvasElement.toDataURL());
});

imagePicker.addEventListener('change', function(event) {
    picture = event.target.files[0];
});

function openCreatePostModal() {
    createPostArea.style.transform = 'translateY(0)';
    initializeMedia();

    if (deferredPrompt) {
        deferredPrompt.prompt();

        deferredPrompt.userChoice.then(function(choiceResult) {
        console.log(choiceResult.outcome);

        if (choiceResult.outcome === 'dismissed') {
            console.log('User cancelled installation');
        } else {
            console.log('User added to home screen');
        }
        });

        deferredPrompt = null;
    }
}

function closeCreatePostModal() {
    createPostArea.style.transform = 'translateY(100vh)';
    imagePickerArea.style.display = 'none';
    videoPlayer.style.display = 'none';
    canvasElement.style.display = 'none';
    locationBtn.style.display = 'inline';
    locationLoader.style.display = 'none';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

// currently not in use, allows user to save assets in cache on demand
function onSaveButtonClick(event) {
    console.log('Clicked');
    if ('caches' in window) {
        caches.open(CACHE_USER_NAME)
            .then(function(cache) {
                cache.add('https://httpbin.org/get');
                cache.add('/src/images/sf-boat.jpg');
            });
    }
}

function clearCards() {
    while(sharedMomentsArea.hasChildNodes()) {
        sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
    }
}

function createCard(data) {
    var cardWrapper = document.createElement('div');
    cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
    var cardTitle = document.createElement('div');
    cardTitle.className = 'mdl-card__title';
    cardTitle.style.backgroundImage = 'url(' + data.image + ')';
    cardTitle.style.backgroundSize = 'cover';
    cardTitle.classList.add('image-center');
    cardWrapper.appendChild(cardTitle);
    var cardTitleTextElement = document.createElement('h2');
    cardTitleTextElement.style.color = 'white';
    cardTitleTextElement.className = 'mdl-card__title-text';
    cardTitleTextElement.textContent = data.title;
    cardTitle.appendChild(cardTitleTextElement);
    var cardSupportingText = document.createElement('div');
    cardSupportingText.className = 'mdl-card__supporting-text';
    cardSupportingText.textContent = data.location;
    cardSupportingText.style.textAlign = 'center';
    // var cardSaveButton = document.createElement('button');
    // cardSaveButton.textContent = 'Save';
    // cardSaveButton.addEventListener('click', onSaveButtonClick);
    // cardSupportingText.appendChild(cardSaveButton);
    cardWrapper.appendChild(cardSupportingText);
    componentHandler.upgradeElement(cardWrapper);
    sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
    clearCards();
    for (var i = 0; i < data.length; i++) {
        createCard(data[i]);
    }
}

function getArrayFromObject(data) {
    var dataArray = [];
    for (var key in data) {
        dataArray.push(data[key]);
    }
    return dataArray;
}

var networkDataReceived = false;

fetch(DATABASE_URL + 'posts.json')
    .then(function(res) {
        return res.json();
    })
    .then(function(data) {
        networkDataReceived = true;
        console.log('From web:', data);
        var dataArray = getArrayFromObject(data);
        updateUI(dataArray);
    });

if ('indexedDB' in window) {
    readAllData('posts')
        .then(function(data) {
            if (!networkDataReceived) {
                console.log('From indexedDB:', data);
                updateUI(data);
            }
        });
}

function sendData() {
    var id = new Date().toISOString();
    var postData = new FormData();
    postData.append('id', id);
    postData.append('title', titleInput.value);
    postData.append('rawLocationLat', fetchedLocation.lat);
    postData.append('rawLocationLng', fetchedLocation.lng);
    postData.append('file', picture, id + '.png');

    fetch(POST_URL, {
        method: 'POST',
        body: postData
    })
    .then(function(res) {
        console.log('Sent data', res);
        updateUI();
    })
    .catch(function(err) {
        console.error(err);
    });
}

form.addEventListener('submit', function(event) {
    event.preventDefault();

    if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
        return;
    }

    closeCreatePostModal();

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready
            .then(function(sw) {
                var post = {
                    id: new Date().toISOString(),
                    title: titleInput.value,
                    location: locationInput.value,
                    picture: picture,
                    rawLocation: fetchedLocation
                };
                writeData('sync-posts', post)
                    .then(function() {
                        return sw.sync.register('sync-new-post');
                    })
                    .then(function() {
                        var data = { message: 'Your post was saved for syncing' };
                        snackbarContainer.MaterialSnackbar.showSnackbar(data);
                    })
                    .catch(function(err) {
                        console.error(err);
                    });
            });
    } else {
        sendData();
    }
});
