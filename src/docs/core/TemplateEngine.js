/**
 * TemplateEngine.js
 * Simple Handlebars-like template engine for documentation generation
 */
class TemplateEngine {
    /**
     * Render a template with the given context
     * @param {string} template - Template string
     * @param {object} context - Data context
     * @returns {string} Rendered string
     */
    render(template, context) {
        if (!template) return '';
        let result = template;

        // Handle conditionals: {{#if condition}}...{{/if}}
        result = result.replace(/{{#if\s+([\w.]+)}}([\s\S]*?){{\/if}}/g, (match, key, content) => {
            const value = this._getValue(context, key);
            return value ? content : '';
        });

        // Handle loops: {{#each items}}...{{/each}}
        result = result.replace(/{{#each\s+([\w.]+)}}([\s\S]*?){{\/each}}/g, (match, key, content) => {
            const items = this._getValue(context, key);
            if (!Array.isArray(items) || items.length === 0) return '';

            return items.map(item => {
                // Create local context for loop item
                let itemContext;
                if (typeof item === 'object' && item !== null) {
                    itemContext = { ...item, this: item }; // Allow {{name}} and {{this}}
                } else {
                    itemContext = { this: item };
                }

                // Primitive variable replacement inside loop (including {{this}})
                let itemResult = content;
                itemResult = this._replaceVariables(itemResult, itemContext);
                return itemResult;
            }).join('');
        });

        // Handle variable replacement: {{variable}}
        result = this._replaceVariables(result, context);

        return result;
    }

    /**
     * Replace simple variables in string
     * @private
     */
    _replaceVariables(str, context) {
        return str.replace(/{{([\w.]+)}}/g, (match, key) => {
            const value = this._getValue(context, key);

            if (Array.isArray(value)) {
                return value.join(', ');
            }
            return value !== undefined && value !== null ? String(value) : ''; // Return empty string if undefined
        });
    }

    /**
     * Get value from nested object using dot notation
     * @private
     */
    _getValue(obj, path) {
        if (!path || obj === undefined || obj === null) return undefined;
        if (path === 'this') return obj.this !== undefined ? obj.this : obj;

        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }
}

module.exports = new TemplateEngine();
