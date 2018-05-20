const fs = require('fs-extra');
const Handlebars = require('handlebars');

/**
 * Render the data using a template that correspond to the requested format
 */
function render(data, format) {
	if (format === 'json') {
		return Promise.resolve(data);
	}

	const templateAlias = {
		'html': 'html',
		'htm': 'html',
		'web': 'html',
		'wikitext': 'wikitext',
		'wt': 'wikitext'
	};
	const filename = __dirname + '/templates/template.' + templateAlias[format];
	return fs.readFile(filename, {encoding: 'utf-8'})
		.then(templateContent => Handlebars.compile(templateContent))
		.then(template => template(data));
}

module.exports = render;
