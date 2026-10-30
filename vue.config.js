module.exports = {
  publicPath: '.',

  pwa: {
    name: process.env.VUE_APP_NAME,
    themeColor: "#ffffff",
    appleMobileWebAppCapable: true,
    manifestOptions: {
      background_color: "#ffffff"
    }
  },

  productionSourceMap: false
}
