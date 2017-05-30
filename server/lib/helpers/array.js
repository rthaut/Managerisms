Array.prototype.implodeNested = function (pieces) {

  const total = pieces.reduce((acc, val) => acc * val.length, 1);

  let result = [];
  let step, target;
  let k = 0;  // an incrementor for pieces with one than one sub-piece
  for (let i = 0; i < pieces.length; i++) {

    step = Math.ceil(total / pieces[i].length);
    if (pieces[i].length > 1) {
      step = Math.ceil(step / (Math.pow(pieces[i].length, k++)));
    }

    for (let j = 0; j < total; j++) {

      if (!Array.isArray(result[j])) {
        result[j] = [];
      }

      target = (Math.floor(j / step) % pieces[i].length);
      result[j][i] = pieces[i][target];

    }

  }

  return result;

}
