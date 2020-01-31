var dbPromise = idb.open('post-store', 1, function(db) {
    if (!db.objectStoreNames.contains('posts')) {
        db.createObjectStore('posts', { keyPath: 'id' });
    }
});

function writeData(storeName, data) {
    return dbPromise
        .then(function(db) {
            var tx = db.transaction(storeName, 'readwrite');
            var store = tx.objectStore(storeName);
            store.put(data);
            return tx.complete;
        });
}

function readAllData(storeName) {
    return dbPromise
        .then(function(db) {
            var tx = db.transaction(storeName, 'readonly');
            var store = tx.objectStore(storeName);
            return store.getAll();
        });
}

function clearAllData(storeName) {
    return dbPromise
        .then(function(db) {
            var tx = db.transaction(storeName, 'readwrite');
            var store = tx.objectStore(storeName);
            store.clear();
            return tx.complete;
        });
}

function deleteItemFromData(storeName, id) {
    return dbPromise
        .then(function(db) {
            var tx = db.transaction(storeName, 'readwrite');
            var store = tx.objectStore(storeName);
            store.delete(id);
            return tx.complete;
        });
}
