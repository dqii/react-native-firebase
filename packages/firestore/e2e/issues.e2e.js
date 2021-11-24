/*
 * Copyright (c) 2016-present Invertase Limited & Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this library except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

const COLLECTION = 'firestore';
const { getE2eEmulatorHost } = require('@react-native-firebase/app/e2e/helpers');
const jsFirebase = require('firebase/compat/app');
const { wipe } = require('./helpers');
require('firebase/compat/firestore');

const testTypes = {
  stringType: 'stringtype',
  numberType: 42,
  doubleType: 3.14159,
  booleanTypeTrue: true,
  booleanTypeFalse: false,
  // dateType: new Date(),
  // mapType: { mapProperty1: 'mapProperty1', mapProperty2: 'mapProperty2' },
  // arrayType: ['arrayEntry1', 'arrayEntry2'],
  nullType: null,
  // textType
  // geoPointType
  // referenceType
  // bytesType
};

describe('firestore()', function () {
  describe('pagination', function () {
    before(async function () {
      await Promise.all([
        firebase.firestore().doc(`${COLLECTION}/wbXwyLJheRfYXXWlY46j`).set({ index: 2, number: 2 }),
        firebase.firestore().doc(`${COLLECTION}/kGC5cYPN1nKnZCcAb9oQ`).set({ index: 6, number: 2 }),
        firebase.firestore().doc(`${COLLECTION}/8Ek8iWCDQPPJ5s2n8PiQ`).set({ index: 4, number: 2 }),
        firebase.firestore().doc(`${COLLECTION}/mr7MdAygvuheF6AUtWma`).set({ index: 1, number: 1 }),
        firebase.firestore().doc(`${COLLECTION}/RCO5SvNn4fdoE49OKrIV`).set({ index: 3, number: 1 }),
        firebase.firestore().doc(`${COLLECTION}/CvVG7VP1hXTtcfdUaeNl`).set({ index: 5, number: 1 }),
      ]);
    });

    it('returns all results', async function () {
      const db = firebase.firestore();
      const ref = db.collection(COLLECTION).orderBy('number', 'desc');
      const allResultsSnapshot = await ref.get();
      allResultsSnapshot.forEach((doc, i) => {
        if (i === 0) {
          doc.id.should.equal('wbXwyLJheRfYXXWlY46j');
        }
        if (i === 1) {
          doc.id.should.equal('kGC5cYPN1nKnZCcAb9oQ');
        }
        if (i === 2) {
          doc.id.should.equal('8Ek8iWCDQPPJ5s2n8PiQ');
        }
        if (i === 3) {
          doc.id.should.equal('mr7MdAygvuheF6AUtWma');
        }
        if (i === 4) {
          doc.id.should.equal('RCO5SvNn4fdoE49OKrIV');
        }
        if (i === 5) {
          doc.id.should.equal('CvVG7VP1hXTtcfdUaeNl');
        }
      });
    });

    it('returns first page', async function () {
      const db = firebase.firestore();
      const ref = db.collection(COLLECTION).orderBy('number', 'desc');
      const firstPageSnapshot = await ref.limit(2).get();
      should.equal(firstPageSnapshot.docs.length, 2);
      firstPageSnapshot.forEach((doc, i) => {
        if (i === 0) {
          doc.id.should.equal('wbXwyLJheRfYXXWlY46j');
        }
        if (i === 1) {
          doc.id.should.equal('kGC5cYPN1nKnZCcAb9oQ');
        }
      });
    });

    it('returns second page', async function () {
      const db = firebase.firestore();
      const ref = db.collection(COLLECTION).orderBy('number', 'desc');
      const firstPageSnapshot = await ref.limit(2).get();
      let lastDocument;
      firstPageSnapshot.forEach(doc => {
        lastDocument = doc;
      });

      const secondPageSnapshot = await ref.startAfter(lastDocument).limit(2).get();
      should.equal(secondPageSnapshot.docs.length, 2);
      secondPageSnapshot.forEach((doc, i) => {
        if (i === 0) {
          doc.id.should.equal('8Ek8iWCDQPPJ5s2n8PiQ');
        }
        if (i === 1) {
          doc.id.should.equal('mr7MdAygvuheF6AUtWma');
        }
      });
    });
  });

  describe.only('type consistency', function () {
    before(async function () {
      // clear the database so we may assert correctly
      await wipe();

      // Put one example of each type in our document using JS SDK
      jsFirebase.initializeApp(FirebaseHelpers.app.config());
      jsFirebase.firestore().useEmulator(getE2eEmulatorHost(), 8080);
      await jsFirebase.firestore().doc(`${COLLECTION}/dataTypeExamplesJS`).set(testTypes);

      // Put one example of each type in our document using native
      await firebase.firestore().doc(`${COLLECTION}/dataTypeExamplesNative`).set(testTypes);
    });

    it('types inserted by JS are equal when fetched native', async function () {
      const ref = firebase.firestore().doc(`${COLLECTION}/dataTypeExamplesJS`);
      const typesSnap = await ref.get();
      const typesTestReturn = typesSnap.data();
      // we do need to massage the Date just a little, it comes back as a Timestamp
      // typesTestReturn.dateType = typesTestReturn.dateType.toDate();
      console.error('got typesTest: ' + JSON.stringify(typesTestReturn));
      Object.keys(typesTestReturn).forEach(type => {
        if (typesTestReturn[type] === undefined) {
          console.error('expected type was not defined: ' + type);
          should.equal(typesTestReturn[type] === undefined, false);
        }
        // expect(typesTestReturn[type]).to.deep.equal(typesTypes[type]);
        should.equal(typesTestReturn[type], testTypes[type]);
      });
    });

    it('types inserted by native are equal to JS types when both fetched native', async function () {
      let ref = firebase.firestore().doc(`${COLLECTION}/dataTypeExamplesJS`);
      let typesSnap = await ref.get();
      const typesTestReturnJS = typesSnap.data();
      ref = firebase.firestore().doc(`${COLLECTION}/dataTypeExamplesNative`);
      typesSnap = await ref.get();
      const typesTestReturnNative = typesSnap.data();
      // we do need to massage the Date just a little, it comes back as a Timestamp
      // typesTestReturn.dateType = typesTestReturn.dateType.toDate();
      console.error('got typesTestJS: ' + JSON.stringify(typesTestReturnJS));
      Object.keys(typesTestReturnJS).forEach(type => {
        if (typesTestReturnJS[type] === undefined) {
          console.error('expected type was not defined: ' + type);
          should.equal(typesTestReturnJS[type] === undefined, false);
        }
        // expect(typesTestReturnJS[type]).to.deep.equal(typesTypes[type]);
        should.equal(typesTestReturnJS[type], testTypes[type]);
      });

      console.error('got typesTestNative: ' + JSON.stringify(typesTestReturnNative));
      Object.keys(typesTestReturnNative).forEach(type => {
        if (typesTestReturnNative[type] === undefined) {
          console.error('expected type was not defined: ' + type);
          should.equal(typesTestReturnNative[type] === undefined, false);
        }
        // expect(typesTestReturnNative[type]).to.deep.equal(typesTypes[type]);
        should.equal(typesTestReturnNative[type], testTypes[type]);
        should.equal(typesTestReturnNative[type], typesTestReturnJS[type]);
      });
    });

    it('types inserted by JS may be queried by native with filters', async function () {
      const ref = firebase
        .firestore()
        .collection(`${COLLECTION}`)
        .where('numberType', 'in', [42, 43]);
      typesSnap = await ref.get();
      should.equal(typesSnap.docs.length, 2);
      // typesSnap.docs.forEach((doc, i) => {
      //   console.error(`got typesTestJS item ${doc.ref.path}: ${JSON.stringify(doc.data())}`);
      // });
      // Object.keys(typesTestReturnJS).forEach(type => {
      //   if (typesTestReturnJS[type] === undefined) {
      //     console.error('expected type was not defined: ' + type);
      //     should.equal(typesTestReturnJS[type] === undefined, false);
      //   }
      //   should.equal(typesTestReturnJS[type], testTypes[type]);
      // });
    });
  });
});
