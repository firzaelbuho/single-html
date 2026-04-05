document.addEventListener('DOMContentLoaded', () => {
  const jsonInput = document.getElementById('jsonInput');
  const jsonOutput = document.getElementById('jsonOutput');
  const formatBtn = document.getElementById('formatBtn');
  const simplifyBtn = document.getElementById('simplifyBtn');
  const copyBtn = document.getElementById('copyBtn');

  formatBtn.addEventListener('click', () => {
    try {
      const raw = jsonInput.value.trim();
      if (!raw) return;
      const parsed = JSON.parse(raw);
      jsonInput.value = JSON.stringify(parsed, null, 2);
    } catch (e) {
      alert("Invalid JSON format");
    }
  });

  simplifyBtn.addEventListener('click', () => {
    try {
      const parsed = jsonInput.value.trim();
      if (!parsed) {
        jsonOutput.value = "";
        return;
      }
      const data = JSON.parse(parsed);
      
      // Core simplification logic
      function internalSimplify(obj) {
        if (Array.isArray(obj)) {
          if (obj.length === 0) return [];
          // Keep only the first element to simplify the array structure
          return [internalSimplify(obj[0])];
        } else if (obj !== null && typeof obj === 'object') {
          const res = {};
          for (let k in obj) {
            res[k] = internalSimplify(obj[k]);
          }
          return res;
        }
        // Returns the actual primitive value
        return obj; 
      }

      const result = internalSimplify(data);
      jsonOutput.value = JSON.stringify(result, null, 2);
      jsonOutput.classList.remove('error');
    } catch (e) {
      jsonOutput.classList.add('error');
      jsonOutput.value = "Error parsing JSON:\n" + e.message;
    }
  });

  copyBtn.addEventListener('click', () => {
    if (jsonOutput.value && !jsonOutput.classList.contains('error')) {
      navigator.clipboard.writeText(jsonOutput.value)
        .then(() => {
          const originalText = copyBtn.innerText;
          copyBtn.innerText = "Copied!";
          setTimeout(() => {
             copyBtn.innerText = originalText;
          }, 2000);
        })
        .catch(err => alert("Failed to copy"));
    }
  });
});
