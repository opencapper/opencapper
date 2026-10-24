import Module from "node:module";

// typescript-eslint throws on TypeScript 7 (no compiler API); route its bare
// `typescript` require to the 6.x compat package before the configs load.
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  return resolveFilename.call(
    this,
    request === "typescript" ? "@typescript/typescript6" : request,
    ...rest,
  );
};

const { defineConfig, globalIgnores } = await import("eslint/config");
const { default: nextVitals } =
  await import("eslint-config-next/core-web-vitals");
const { default: nextTs } = await import("eslint-config-next/typescript");

// eslint-plugin-react uses the `getFilename` API removed in ESLint 10.
const disableReactPlugin = Object.fromEntries(
  [
    "display-name",
    "jsx-key",
    "jsx-no-comment-textnodes",
    "jsx-no-duplicate-props",
    "jsx-no-target-blank",
    "jsx-no-undef",
    "jsx-uses-react",
    "jsx-uses-vars",
    "no-children-prop",
    "no-danger-with-children",
    "no-deprecated",
    "no-direct-mutation-state",
    "no-find-dom-node",
    "no-is-mounted",
    "no-render-return-value",
    "no-string-refs",
    "no-unescaped-entities",
    "no-unknown-property",
    "no-unsafe",
    "prop-types",
    "react-in-jsx-scope",
    "require-render-return",
    "self-closing-comp",
    "jsx-no-useless-fragment",
  ].map((rule) => [`react/${rule}`, "off"]),
);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    rules: {
      ...disableReactPlugin,
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);

export default eslintConfig;
