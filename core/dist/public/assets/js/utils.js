// Template loader
export async function loadTemplate(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${url}`);
    }
    return await response.text();
  }
  
  // Simple template renderer
  export function renderTemplate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }
  
  // Form data to object converter
  export function formDataToObject(formData) {
    const obj = {};
    formData.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }