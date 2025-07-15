console.log('🔍 Plain JS Renderer script started');

// Simple vanilla JS test
const container = document.getElementById('root');
console.log('🔍 Root container found:', !!container);

if (container) {
  console.log('🔍 Setting innerHTML...');
  container.innerHTML = `
    <div style="padding: 20px; font-family: Arial; background-color: lightgreen;">
      <h1 style="color: red;">PlayListify Plain JS Test</h1>
      <p>Plain JavaScript is working!</p>
      <button onclick="alert('Button works!')">Test Button</button>
    </div>
  `;
  console.log('🔍 Content set successfully');
} else {
  console.error('❌ Root container not found');
}

console.log('🔍 Plain JS script completed');