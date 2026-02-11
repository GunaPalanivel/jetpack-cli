/**
 * TemplateEngine - Variable interpolation and template rendering
 * Supports {{variable}}, {{#if condition}}...{{/if}}, {{#each items}}...{{/each}}
 */
class TemplateEngine {
  /**
   * Render a template string with context data
   * @param {string} template - Template string with {{variable}} syntax
   * @param {object} context - Data object for interpolation
   * @returns {string} Rendered template
   */
  render(template, context) {
    if (!template || typeof template !== 'string') {
      return '';
    }

    let rendered = template;

    // Process conditionals first: {{#if condition}}...{{/if}}
    rendered = this._processConditionals(rendered, context);

    // Process loops: {{#each items}}...{{/each}}
    rendered = this._processLoops(rendered, context);

    // Process simple variables: {{variable}}
    rendered = this._processVariables(rendered, context);

    return rendered;
  }

  /**
   * Process conditional blocks
   * @private
   */
  _processConditionals(template, context) {
    const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    
    return template.replace(conditionalRegex, (match, condition, content) => {
      const value = this._getValue(context, condition);
      
      // Check if value is truthy (exists and not empty)
      if (this._isTruthy(value)) {
        return content;
      }
      
      return '';
    });
  }

  /**
   * Process loop blocks
   * @private
   */
  _processLoops(template, context) {
    const loopRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    
    return template.replace(loopRegex, (match, arrayName, content) => {
      const array = this._getValue(context, arrayName);
      
      if (!Array.isArray(array) || array.length === 0) {
        return '';
      }
      
      return array.map(item => {
        // Support both primitive values and objects
        const itemContext = typeof item === 'object' 
          ? { ...context, ...item, this: item }
          : { ...context, this: item };
        
        return this._processVariables(content, itemContext);
      }).join('');
    });
  }

  /**
   * Process simple variable replacements
   * @private
   */
  _processVariables(template, context) {
    const variableRegex = /\{\{(\w+(?:\.\w+)*)\}\}/g;
    
    return template.replace(variableRegex, (match, path) => {
      const value = this._getValue(context, path);
      
      // Return empty string for undefined/null
      if (value === undefined || value === null) {
        return '';
      }
      
      // Handle arrays - join with commas
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      
      return String(value);
    });
  }

  /**
   * Get nested value from context using dot notation
   * @private
   */
  _getValue(context, path) {
    if (!path) return undefined;
    
    const keys = path.split('.');
    let value = context;
    
    for (const key of keys) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[key];
    }
    
    return value;
  }

  /**
   * Check if value is truthy (exists and not empty)
   * @private
   */
  _isTruthy(value) {
    if (value === undefined || value === null) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return value !== 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return Boolean(value);
  }
}

module.exports = new TemplateEngine();
