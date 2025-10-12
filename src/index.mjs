// Полный список глобальных объектов браузера
const BROWSER_GLOBALS = new Set([
    // === ОСНОВНЫЕ ОБЪЕКТЫ БРАУЗЕРА ===
    'document',
    'navigator',
    'location',
    'history',
    'screen',
    'frames',
    'parent',
    'top',
    'self',

    // === STORAGE API ===
    'localStorage',
    'sessionStorage',
    'indexedDB',

    // === CONSOLE И УТИЛИТЫ ===
    'console',
    'alert',
    'confirm',
    'prompt',

    // === TIMERS ===
    'setTimeout',
    'setInterval',
    'clearTimeout',
    'clearInterval',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'requestIdleCallback',
    'cancelIdleCallback',

    // === NETWORK API ===
    'fetch',
    'XMLHttpRequest',
    'WebSocket',
    'EventSource',
    'AbortController',
    'AbortSignal',

    // === URL И FORM API ===
    'URL',
    'URLSearchParams',
    'FormData',
    'Blob',
    'File',
    'FileReader',
    'FileList',

    // === CRYPTO API ===
    'crypto',
    'SubtleCrypto',

    // === PERFORMANCE API ===
    'performance',
    'PerformanceObserver',

    // === DOM UTILITIES ===
    'getComputedStyle',
    'matchMedia',
    'ResizeObserver',
    'IntersectionObserver',
    'MutationObserver',

    // === WINDOW METHODS ===
    'open',
    'close',
    'focus',
    'blur',
    'scroll',
    'scrollTo',
    'scrollBy',
    'print',
    'postMessage',
    'addEventListener',
    'removeEventListener',
    'dispatchEvent',
    'atob',
    'btoa',

    // === JAVASCRIPT BUILT-IN OBJECTS ===
    'Math',
    'Date',
    'RegExp',
    'Error',
    'EvalError',
    'RangeError',
    'ReferenceError',
    'SyntaxError',
    'TypeError',
    'URIError',
    'Promise',
    'Symbol',
    'Map',
    'Set',
    'WeakMap',
    'WeakSet',
    'Array',
    'Object',
    'String',
    'Number',
    'Boolean',
    'Function',
    'ArrayBuffer',
    'DataView',
    'Int8Array',
    'Uint8Array',
    'Uint8ClampedArray',
    'Int16Array',
    'Uint16Array',
    'Int32Array',
    'Uint32Array',
    'Float32Array',
    'Float64Array',
    'BigInt64Array',
    'BigUint64Array',
    'BigInt',

    // === JSON И УТИЛИТЫ ===
    'JSON',
    'parseInt',
    'parseFloat',
    'isNaN',
    'isFinite',
    'encodeURI',
    'decodeURI',
    'encodeURIComponent',
    'decodeURIComponent',
    'escape',
    'unescape',

    // === WEB WORKERS ===
    'Worker',
    'SharedWorker',
    'ServiceWorker',
    'BroadcastChannel',

    // === NOTIFICATIONS ===
    'Notification',

    // === GEOLOCATION ===
    'geolocation',

    // === MEDIA API ===
    'MediaDevices',
    'MediaRecorder',
    'MediaStream',
    'MediaStreamTrack',

    // === CANVAS ===
    'CanvasRenderingContext2D',
    'WebGLRenderingContext',
    'WebGL2RenderingContext',

    // === WEB AUDIO ===
    'AudioContext',
    'OfflineAudioContext',

    // === WEB COMPONENTS ===
    'customElements',
    'ShadowRoot',

    // === INTERSECTION OBSERVER ===
    'IntersectionObserver',

    // === RESIZE OBSERVER ===
    'ResizeObserver',

    // === MUTATION OBSERVER ===
    'MutationObserver',

    // === WEB ANIMATIONS ===
    'Animation',
    'KeyframeEffect',

    // === WEB STREAMS ===
    'ReadableStream',
    'WritableStream',
    'TransformStream',

    // === WEB LOCK API ===
    'navigator.locks',

    // === CLIPBOARD API ===
    'navigator.clipboard',

    // === PERMISSIONS API ===
    'navigator.permissions',

    // === BATTERY API ===
    'navigator.getBattery',

    // === DEVICE ORIENTATION ===
    'DeviceOrientationEvent',
    'DeviceMotionEvent',

    // === TOUCH EVENTS ===
    'Touch',
    'TouchList',
    'TouchEvent',

    // === DRAG AND DROP ===
    'DataTransfer',
    'DataTransferItem',

    // === WEB STORAGE ===
    'Storage',

    // === WEB SOCKETS ===
    'WebSocket',

    // === SERVER-SENT EVENTS ===
    'EventSource',

    // === WEB CRYPTOGRAPHY ===
    'CryptoKey',
    'CryptoKeyPair',

    // === WEB ASSEMBLY ===
    'WebAssembly',

    // === NODE.JS ГЛОБАЛЫ (если используются в браузерном контексте) ===
    'Buffer',
    'process',
    'global',
    'globalThis',

    // === ДОПОЛНИТЕЛЬНЫЕ ГЛОБАЛЬНЫЕ ФУНКЦИИ ===
    'eval',
    'Function',
    'setImmediate',
    'clearImmediate',
]);

// Кэш для проверенных свойств на уровне плагина
const globalPropertiesCache = new Map();

const requireGlobalContainer = {
    meta: {
        type: 'suggestion',
        docs: {
            description:
                'Требует использования глобальных объектов браузера только как свойств других объектов',
            recommended: 'error',
        },
        fixable: 'code',
        schema: [
            {
                type: 'object',
                properties: {
                    exceptions: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Исключения из проверки',
                    },
                    defaultContainer: {
                        type: 'string',
                        description:
                            'Контейнер по умолчанию для автоисправления',
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            requireContainer:
                'Глобальный объект "{{name}}" должен использоваться как свойство объекта (например: {{container}}.{{name}})',
        },
    },
    create(context) {
        const options = context.options[0] || {};
        const { exceptions = [], defaultContainer = 'window' } = options;
        const exceptionsSet = new Set(exceptions);

        // Кэш для области видимости (Map для быстрого поиска)
        const scopeCache = new Map();

        function isWindowProperty(name) {
            // Быстрая проверка исключений
            if (exceptionsSet.has(name)) {
                return false;
            }

            // Проверяем глобальный кэш
            if (globalPropertiesCache.has(name)) {
                return globalPropertiesCache.get(name);
            }

            // Статическая проверка по предопределенному списку
            const isProperty = BROWSER_GLOBALS.has(name);

            // Кэшируем результат глобально
            globalPropertiesCache.set(name, isProperty);
            return isProperty;
        }

        function isLocalVariable(node, scope) {
            const name = node.name;

            // Проверяем кэш области видимости
            const cacheKey = `${scope.uid || 'global'}-${name}`;
            if (scopeCache.has(cacheKey)) {
                return scopeCache.get(cacheKey);
            }

            let currentScope = scope;
            let isLocal = false;

            // Пропускаем глобальную область видимости
            while (currentScope && currentScope.type !== 'global') {
                // Используем Map для быстрого поиска переменных
                const variablesMap =
                    currentScope.variablesMap ||
                    new Map(currentScope.variables.map((v) => [v.name, v]));

                // Кэшируем Map для переиспользования
                if (!currentScope.variablesMap) {
                    currentScope.variablesMap = variablesMap;
                }

                if (variablesMap.has(name)) {
                    isLocal = true;
                    break;
                }
                currentScope = currentScope.upper;
            }

            // Кэшируем результат
            scopeCache.set(cacheKey, isLocal);
            return isLocal;
        }

        function isInTypeAnnotation(node) {
            let current = node.parent;
            while (current) {
                // Проверяем все TypeScript узлы, связанные с типами
                if (current.type && current.type.startsWith('TS')) {
                    return true;
                }
                current = current.parent;
            }
            return false;
        }

        return {
            Identifier(node) {
                // Быстрая проверка - является ли это глобальным объектом
                if (!isWindowProperty(node.name)) {
                    return;
                }

                // Пропускаем TypeScript аннотации типов
                if (isInTypeAnnotation(node)) {
                    return;
                }

                // Быстрая проверка - используется ли как свойство объекта
                const parent = node.parent;
                if (
                    parent?.type === 'MemberExpression' &&
                    parent.object.type === 'Identifier' &&
                    parent.property === node
                ) {
                    return;
                }

                // Быстрая проверка - является ли объявлением
                if (
                    parent?.type === 'VariableDeclarator' &&
                    parent.id === node
                ) {
                    return;
                }
                if (
                    parent?.type === 'FunctionDeclaration' &&
                    parent.id === node
                ) {
                    return;
                }
                if (parent?.type === 'Property' && parent.key === node) {
                    return;
                }
                if (
                    parent?.type === 'ImportSpecifier' ||
                    parent?.type === 'ImportDefaultSpecifier'
                ) {
                    return;
                }

                // Проверяем область видимости - ищем только локальные определения
                const scope = context.sourceCode.getScope(node);

                // Если это локальная переменная, пропускаем
                if (isLocalVariable(node, scope)) {
                    return;
                }

                context.report({
                    node,
                    messageId: 'requireContainer',
                    data: {
                        name: node.name,
                        container: defaultContainer,
                    },
                    fix(fixer) {
                        return fixer.replaceText(
                            node,
                            `${defaultContainer}.${node.name}`
                        );
                    },
                });
            },
        };
    },
};

export const requireGlobalContainerPlugin = {
    meta: {
        name: 'require-global-container',
        version: '1.0.0',
    },
    rules: {
        'require-global-container': requireGlobalContainer,
    },
};

// Экспорт по умолчанию для совместимости с ESLint
export default requireGlobalContainerPlugin;
