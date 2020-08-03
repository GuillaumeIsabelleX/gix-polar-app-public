import {assert} from 'chai';
import {DOMTextSearch} from "./DOMTextSearch";
import {JSDOM} from "jsdom";
import {assertJSON} from "polar-test/src/test/Assertions";
import {DOMTextHits} from "./DOMTextHits";

const jsdomGlobal = require('jsdom-global');

describe('DOMTextSearch', function() {

    it("basic", function() {

        const html = `<html><body><p>this is a basic test</p></body></html>`;
        jsdomGlobal(html);

        // console.log(document);

        const index = DOMTextSearch.createIndex();

        assert.equal(index.toString(), 'this is a basic test');

        const query = 'this is a basic test';
        const hits = index.search(query);

        assert.ok(hits);
        assert.equal(hits.length, 1);

        const hit = hits[0];

        assert.equal(hit.regions.length, 1);
        const region = hit.regions[0];
        assert.equal(region.node.textContent, 'this is a basic test');
        assert.equal(DOMTextHits.extract(hits), 'this is a basic test');
        assert.equal((region.end - region.start) + 1, query.length);

    });

    xit("basic with iframe", function() {

        console.log(JSDOM)

        const html = `<html><body><p>this is a basic test</p><iframe srcdoc=""></iframe></body></html>`;
        jsdomGlobal(html);

        document.querySelector('iframe')!.contentDocument!.documentElement.innerHTML = '<html><body> <p>and this is the iframe</p></body></html>';

        // console.log(document);

        const index = DOMTextSearch.createIndex();

        assert.equal(index.toString(), 'this is a basic test and this is the iframe');

        const result = index.search('this is a basic test');

        assert.ok(result);
        assert.equal(result![0].regions.length, 1);
        assert.equal(result![0].regions[0].node.textContent, 'this is a basic test');

    });

    it("across node types", function() {

        const html = `<html><body><p><b>this</b> <i>is a</i> <a href="http://example.com">basic test</a></p></body></html>`;
        jsdomGlobal(html);

        // console.log(document);

        const index = DOMTextSearch.createIndex();

        // console.log({index});

        assert.equal(index.toString(), 'this is a basic test');

        const result = index.search('this is a basic test');

        console.log({result});

        assert.ok(result);
        assert.ok(result.length === 1);
        assert.equal(result![0].regions.length, 3);

    });


    it("toString with whitespace between nodes", function() {

        const html = `
<html>
<body>
<p>
<b>this</b> and <i>that</i>
</p>

Graph-based neural network

</body>
</html>`;

        jsdomGlobal(html);

        const index = DOMTextSearch.createIndex();

        assert.equal(index.toString(), 'this and that Graph-based neural network');
        const hits = index.search('Graph');
        assert.equal(DOMTextHits.extract(hits), 'Graph');

        assertJSON(hits, [
            {
                "id": "hit-14-18",
                "regions": [
                    {
                        "nodeID": 6,
                        "start": 2,
                        "end": 6,
                        "node": {}
                    }
                ],
                "resume": 19
            }
        ]);

    });


    it("basic incorrect offset", function() {

        const html = `
<html>
<body>
<p>this</p>

Graph-based neural network

</body>
</html>`;

        jsdomGlobal(html);

        const index = DOMTextSearch.createIndex();
        const hits = index.search('Graph');
        assert.equal(DOMTextHits.extract(hits), 'Graph');

        assertJSON(hits, [
            {
                "id": "hit-5-9",
                "regions": [
                    {
                        "nodeID": 2,
                        "start": 2,
                        "end": 6,
                        "node": {}
                    }
                ],
                "resume": 10
            }
        ]);

        assert.equal(index.toString(), 'this Graph-based neural network');

    });


    it("whitespace handling", function() {

        const html = `
<html>
<body>
<p>
this\ris\na\ttest
</p>
</body>
</html>`;

        jsdomGlobal(html);

        const index = DOMTextSearch.createIndex();
        assert.equal(index.toString(), 'this is a test');

        const hits = index.search('this is a test');

        assert.equal(hits.length, 1);
        assert.equal(DOMTextHits.extract(hits), 'this\nis\na\ttest');

    });

});
