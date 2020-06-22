import {FirebaseDatastore} from "polar-bookshelf/web/js/datastore/FirebaseDatastore";
import {NULL_FUNCTION} from "polar-shared/src/util/Functions";
import {Backend} from "polar-shared/src/datastore/Backend";
import {Hashcodes} from "polar-shared/src/util/Hashcodes";
import {FileRef} from "polar-shared/src/datastore/FileRef";
import {DocMetas} from "polar-bookshelf/web/js/metadata/DocMetas";
import {BackendFileRefData} from "polar-bookshelf/web/js/datastore/Datastore";
import {Optional} from "polar-shared/src/util/ts/Optional";
import {DefaultPersistenceLayer} from "polar-bookshelf/web/js/datastore/DefaultPersistenceLayer";
import {Firestore} from "polar-bookshelf/web/js/firebase/Firestore";
import {WriteOpts} from "polar-bookshelf/web/js/datastore/PersistenceLayer";

export namespace DatastoreWriter {

    export interface IData {

    }

    export interface IWriteOpts {
        readonly doc: Blob,
        readonly type: 'pdf' | 'epub';
        readonly title: string;
        readonly description: string;
        readonly url: string;
    }

    export interface WrittenDoc {
        readonly id: string;
    }

    function createRandomID() {
        return Hashcodes.createRandomID();
    }

    export async function write(opts: IWriteOpts): Promise<WrittenDoc> {

        await Firestore.init({enablePersistence: false});

        const datastore = new FirebaseDatastore()
        // TODO add back in the error listener I think.
        await datastore.init(NULL_FUNCTION, {noInitialSnapshot: true, noSync: true});
        const persistenceLayer = new DefaultPersistenceLayer(datastore);

        const fingerprint = createRandomID();
        const filename = createRandomID() + '.' + opts.type;
        const hashcode = Hashcodes.createHashcode(opts.doc);

        console.log("Writing document: " + filename);

        const docMeta = DocMetas.create(fingerprint, 1, filename);

        docMeta.docInfo.title = Optional.of(opts.title)
                                        .getOrElse("Untitled");

        docMeta.docInfo.description = opts.description;
        docMeta.docInfo.filename = filename;
        docMeta.docInfo.backend = Backend.STASH;
        docMeta.docInfo.url = opts.url;
        docMeta.docInfo.hashcode = hashcode;

        const fileRef: FileRef = {
            name: filename,
            hashcode
        }
        const writeFile: BackendFileRefData = {
            backend: Backend.STASH,
            data: opts.doc,
            ...fileRef
        };

        const writeOpts: WriteOpts = {
            writeFile
        };

        await persistenceLayer.write(fingerprint, docMeta, writeOpts);
        await persistenceLayer.stop();

        return {id: fingerprint};


    }

}







