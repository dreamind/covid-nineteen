const mixin = {
  data() {
    return {
      labelWidth: 45,
      barWidths: [70, 60, 60, 60, 60],
    };
  },
  methods: {
    columnWidthStyle(col) {
      let width;
      if (!col) {
        width = this.barWidths[col];
      } else {
        width = this.barWidths[col] + 2 * this.labelWidth + 2;
      }
      width += 'px';
      return {
        width,
      };
    },
  },
};

// eslint-disable-next-line import/prefer-default-export
export { mixin };
