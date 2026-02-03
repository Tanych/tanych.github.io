// --- System Status Updates ---
const updateSystemStatus = () => {
    // Update Privacy Layer status based on API support
    const privacyStatusEl = document.getElementById('privacy-status');
    if (navigator.userAgentData) {
        privacyStatusEl.textContent = 'PRIVACY_LAYER: ACTIVE';
        privacyStatusEl.classList.add('status-active');
    } else {
        privacyStatusEl.textContent = 'PRIVACY_LAYER: N/A';
        privacyStatusEl.classList.add('status-inactive');
    }
};

// --- Latency Calculation (runs after ALL resources are loaded) ---
const updateLatency = () => {
    const latencyStatusEl = document.getElementById('latency-status');
    // A small timeout gives the browser a moment to finalize metrics after the load event
    setTimeout(() => {
        const navTimings = performance.getEntriesByType('navigation');
        if (navTimings.length > 0 && navTimings[0].duration > 0) {
            const loadTime = Math.round(navTimings[0].duration);
            latencyStatusEl.textContent = `LATENCY: ${loadTime}ms`;
        } else {
            latencyStatusEl.textContent = 'LATENCY: N/A';
        }
    }, 100);
};

document.addEventListener('DOMContentLoaded', () => {
    updateSystemStatus(); // Run status updates

    // --- Modal Logic ---
    const navButtons = document.querySelectorAll('.nav-button');
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-button');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'block';
            }
        });
    });

    const closeModal = (modal) => {
        modal.style.display = 'none';
    };

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeModal(button.closest('.modal'));
        });
    });

    window.addEventListener('click', (event) => {
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModal(modal);
            }
        });
    });

    // --- Loading Animation ---
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*&^%$#@!";
    const dataValues = document.querySelectorAll('.data-value, .raw-ua');
    const originalTexts = {};
    let intervals = {};

    const scramble = (element) => {
        let iteration = 0;
        const originalText = element.textContent;
        originalTexts[element.id] = originalText;

        intervals[element.id] = setInterval(() => {
            element.textContent = originalText.split("")
                .map((letter, index) => {
                    if(index < iteration) {
                        return originalTexts[element.id][index];
                    }
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join("");

            if(iteration >= originalTexts[element.id].length){
                clearInterval(intervals[element.id]);
            }
            iteration += 1 / 2;
        }, 40);
    };

    dataValues.forEach(el => el.id ? scramble(el) : null);

    const updateValue = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            clearInterval(intervals[id]);
            element.textContent = value;
            scramble(element);
        }
    };

    // --- Data Fetching and Parsing ---

    // 1. Display Raw User-Agent
    updateValue('ua-raw', navigator.userAgent);

    // 2. Fetch, Parse, and Display Client Hints
    if (navigator.userAgentData) {
        const uad = navigator.userAgentData;

        updateValue('ch-platform', uad.platform || 'N/A');
        updateValue('ch-mobile', uad.mobile.toString());
        const brandList = uad.brands
            .filter(b => b.brand !== "Not=A?Brand")
            .map(b => `${b.brand} v${b.version}`)
            .join(', ');
        updateValue('ch-brand', brandList || 'N/A');
        updateValue('ch-languages', navigator.languages.join(', '));

        uad.getHighEntropyValues(['platformVersion', 'architecture', 'uaFullVersion'])
            .then(hints => {
                updateValue('ch-platform-version', hints.platformVersion || 'N/A');
                updateValue('ch-arch', hints.architecture || 'N/A');
                updateValue('ch-full-version', hints.uaFullVersion || 'N/A');
            })
            .catch(error => console.error("High-entropy hints error: ", error));

    } else {
        ['ch-platform', 'ch-platform-version', 'ch-arch', 'ch-brand', 'ch-full-version', 'ch-mobile']
            .forEach(id => updateValue(id, 'API NOT SUPPORTED'));
    }

    // --- Hub Info Updater ---
    const hubInfoText = document.getElementById('hub-info-text');
    if (hubInfoText) {
        const defaultHubText = hubInfoText.textContent;
        document.querySelectorAll('.nav-button').forEach(button => {
            button.addEventListener('mouseenter', () => {
                const info = button.getAttribute('data-info');
                if (info) {
                    hubInfoText.textContent = info;
                }
            });
            button.addEventListener('mouseleave', () => {
                hubInfoText.textContent = defaultHubText;
            });
        });
    }
});

 // This event fires after the whole page, including all dependent resources, has finished loading
window.addEventListener('load', updateLatency);