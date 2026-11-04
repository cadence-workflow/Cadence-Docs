// Webpack resolves an imported image to its URL.
declare module '*.png' {
  const src: string;
  export default src;
}
