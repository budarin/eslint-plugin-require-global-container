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

        // Кэш для проверенных свойств window
        const windowPropertiesCache = new Map();

        function isWindowProperty(name) {
            if (exceptionsSet.has(name)) {
                return false;
            }

            // Проверяем кэш
            if (windowPropertiesCache.has(name)) {
                return windowPropertiesCache.get(name);
            }

            let isProperty = false;

            try {
                // Динамическая проверка в runtime
                if (typeof globalThis !== 'undefined' && globalThis.window) {
                    // В браузере проверяем напрямую
                    isProperty = name in globalThis.window;
                } else if (typeof global !== 'undefined') {
                    // В Node.js создаем минимальную имитацию window для проверки
                    const mockWindow = {
                        console: console,
                        setTimeout: setTimeout,
                        setInterval: setInterval,
                        clearTimeout: clearTimeout,
                        clearInterval: clearInterval,
                        // Добавляем другие глобальные объекты Node.js, которые есть и в браузере
                        URL: typeof URL !== 'undefined' ? URL : undefined,
                        URLSearchParams:
                            typeof URLSearchParams !== 'undefined'
                                ? URLSearchParams
                                : undefined,
                        crypto:
                            typeof crypto !== 'undefined' ? crypto : undefined,
                        performance:
                            typeof performance !== 'undefined'
                                ? performance
                                : undefined,
                        fetch: typeof fetch !== 'undefined' ? fetch : undefined,
                        FormData:
                            typeof FormData !== 'undefined'
                                ? FormData
                                : undefined,
                        Blob: typeof Blob !== 'undefined' ? Blob : undefined,
                        File: typeof File !== 'undefined' ? File : undefined,
                        FileReader:
                            typeof FileReader !== 'undefined'
                                ? FileReader
                                : undefined,
                    };

                    // Проверяем, есть ли свойство в mock window
                    isProperty =
                        name in mockWindow && mockWindow[name] !== undefined;

                    // Дополнительно проверяем браузерные API, которых нет в Node.js
                    const browserOnlyAPIs = [
                        'document',
                        'localStorage',
                        'sessionStorage',
                        'location',
                        'history',
                        'navigator',
                        'screen',
                        'alert',
                        'confirm',
                        'prompt',
                        'XMLHttpRequest',
                        'requestAnimationFrame',
                        'cancelAnimationFrame',
                        'getComputedStyle',
                        'matchMedia',
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
                    ];

                    if (!isProperty && browserOnlyAPIs.includes(name)) {
                        isProperty = true;
                    }
                }
            } catch (error) {
                // В случае ошибки считаем, что это не window property
                isProperty = false;
            }

            // Кэшируем результат
            windowPropertiesCache.set(name, isProperty);
            return isProperty;
        }

        return {
            Identifier(node) {
                // Динамически проверяем, является ли это свойством window
                if (!isWindowProperty(node.name)) {
                    return;
                }

                // Пропускаем ЛЮБОЕ использование как свойство объекта (obj.console, window.console, etc.)
                if (
                    node.parent?.type === 'MemberExpression' &&
                    node.parent.object.type === 'Identifier' &&
                    node.parent.property === node
                ) {
                    return;
                }

                // Пропускаем объявления
                if (
                    node.parent?.type === 'VariableDeclarator' &&
                    node.parent.id === node
                ) {
                    return;
                }
                if (
                    node.parent?.type === 'FunctionDeclaration' &&
                    node.parent.id === node
                ) {
                    return;
                }
                if (
                    node.parent?.type === 'Property' &&
                    node.parent.key === node
                ) {
                    return;
                }
                if (
                    node.parent?.type === 'ImportSpecifier' ||
                    node.parent?.type === 'ImportDefaultSpecifier'
                ) {
                    return;
                }

                // Проверяем область видимости - ищем только локальные определения
                const scope = context.sourceCode.getScope(node);
                let currentScope = scope;

                // Пропускаем глобальную область видимости
                while (currentScope && currentScope.type !== 'global') {
                    const variable = currentScope.variables.find(
                        (v) => v.name === node.name
                    );
                    if (variable) {
                        return; // Найдена локальная переменная
                    }
                    currentScope = currentScope.upper;
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
