import { adminDb } from './admin';

/**
 * Deletes a collection, including all its documents and subcollections, recursively.
 * @param collectionPath The path to the collection to delete.
 * @param batchSize The number of documents to delete in each batch.
 */
export async function deleteCollection(collectionPath: string, batchSize: number = 50) {
    const collectionRef = adminDb.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: (value?: unknown) => void) {
    const snapshot = await query.get();

    if (snapshot.size === 0) {
        // When there are no documents left, we are done.
        resolve();
        return;
    }

    // Delete documents in a batch
    const batch = adminDb.batch();
    for (const doc of snapshot.docs) {
        // Recursively delete subcollections of each document
        const subcollections = await doc.ref.listCollections();
        for (const subcollection of subcollections) {
            await deleteCollection(subcollection.path);
        }
        batch.delete(doc.ref);
    }
    await batch.commit();

    // Recurse on the next batch
    process.nextTick(() => {
        deleteQueryBatch(query, resolve);
    });
}
