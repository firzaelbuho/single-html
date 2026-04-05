// Hardcoded list of local graphic assets based on the filesystem exploration
const artworks = [
    "aligator.svg", "cenderawasih.svg",
    "crocodile.svg", "deer.svg", "dog.svg", "dolphin.svg",
    "dove.svg", "elephant.svg", "giraffe.svg", "hedgehog.svg",
    "hippotatamus.svg", "horse.svg", "king cobra.svg", "komodo dragon.svg",
    "orangutan.svg", "owl.svg", "rabbit.svg", "rhinoceros.svg"
];

// DOM Elements
const gallery = document.getElementById('gallery');

/**
 * Initializes the gallery by dynamically creating card elements
 * and rendering the SVG icons inside them using CSS masks.
 */
function initGallery() {
    // Clear any existing contents (useful if re-initialized)
    gallery.innerHTML = '';

    // Create elements for each artwork
    artworks.forEach((filename, index) => {
        // Remove .svg extension for title
        const niceName = filename.replace('.svg', '');

        // Artwork Card wrapper
        const card = document.createElement('div');
        card.className = 'art-card';
        card.setAttribute('role', 'article');
        card.setAttribute('aria-label', niceName);

        // For cascading animation load effect
        card.style.animation = `fadeIn 0.5s ease forwards ${index * 0.03}s`;
        card.style.opacity = '0';

        // Icon container wrapping the masked div
        const iconContainer = document.createElement('div');
        iconContainer.className = 'icon-container';

        // The masked DIV takes the shape of the SVG and accepts background-color changes
        const artIcon = document.createElement('div');
        artIcon.className = 'art-icon';

        // Encode URI to handle spaces in filename safely inside url() function
        const svgUrl = `assets/graphics/animal/${encodeURIComponent(filename)}`;

        // Apply masking technique for SVG shapes
        artIcon.style.maskImage = `url("${svgUrl}")`;
        artIcon.style.webkitMaskImage = `url("${svgUrl}")`;
        // Default color is white for a dark theme design
        artIcon.style.backgroundColor = '#ffffff';

        iconContainer.appendChild(artIcon);

        // Card footer
        const footer = document.createElement('div');
        footer.className = 'card-footer';

        // Title element
        const title = document.createElement('div');
        title.className = 'art-title';
        title.textContent = niceName;

        // Local per-image color picker container
        const pickerContainer = document.createElement('div');
        pickerContainer.className = 'local-color-picker';

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = '#ffffff';
        colorInput.setAttribute('aria-label', `Change color for ${niceName}`);
        colorInput.title = `Change tint for ${niceName}`;

        // Listener to change ONLY this graphics tint
        colorInput.addEventListener('input', (event) => {
            const selectedColor = event.target.value;
            artIcon.style.backgroundColor = selectedColor;
            // Add a soft glow referencing the selected color
            iconContainer.style.filter = `drop-shadow(0 0 12px ${selectedColor}66)`;

            // Allow card hover effect to inherit the glow via CSS variables if needed, 
            // but the inline filter directly on iconContainer is more immediate.
        });

        pickerContainer.appendChild(colorInput);

        footer.appendChild(title);
        footer.appendChild(pickerContainer);

        // Assemble card
        card.appendChild(iconContainer);
        card.appendChild(footer);

        // Add into DOM
        gallery.appendChild(card);
    });
}

// Fade in animation for sequential card loading
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
document.head.appendChild(styleSheet);

// Start app
initGallery();
