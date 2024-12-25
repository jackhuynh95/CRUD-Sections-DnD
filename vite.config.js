import { defineConfig } from "vite";
import vue2 from "@vitejs/plugin-vue2";
// import Components from "unplugin-vue-components/vite";
import { fileURLToPath, URL } from "node:url";
// import { VuetifyResolver } from "unplugin-vue-components/resolvers";

// function VuetifyResolver() {
//   return {
//     type: "component",
//     resolve: (name) => {
//       if (name.match(/^V[A-Z]/)) {
//         return {
//           name,
//           from: "vuetify/lib",
//         };
//       }
//     },
//   };
// }

export default defineConfig({
  plugins: [
    vue2(),
    // Components({
    //   resolvers: [VuetifyResolver()],
    //   dts: false,
    // }),
  ],
  // Resolver
  resolve: {
    // https://vitejs.dev/config/shared-options.html#resolve-alias
    vue: "vue/dist/vue.esm.js",
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "~": fileURLToPath(new URL("./node_modules", import.meta.url)),
    },
    extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
  },
  optimizeDeps: {
    // https://vite.dev/config/dep-optimization-options#optimizedeps-include
    include: ["vuetify", "fabric"],
  },
});
