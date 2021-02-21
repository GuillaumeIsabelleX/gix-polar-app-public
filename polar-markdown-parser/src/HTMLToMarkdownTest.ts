import {assert} from 'chai';
import {HTMLToMarkdown} from "./HTMLToMarkdown";
import html2markdown = HTMLToMarkdown.html2markdown;

describe('HTMLToMarkdown', function() {

    it('basic', function() {

        assert.equal(html2markdown('<p><strong>this is bold</strong></p>'), '**this is bold**');

    });

    it('<br/>', function() {
        assert.equal(html2markdown('<br/>'), '');
    });

});
