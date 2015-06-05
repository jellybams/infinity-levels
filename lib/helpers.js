/**
 * This file contains helper functions.
 */

/**
 * Flow control, will run `fn` after being called
 * `amount` times.
 * 
 * @param  {Number}   amount  number of times to be called
 * @param  {Function} fn      the function to invoke `amount` calls
 */
module.exports.after = function afterBuilder(amount, fn) {
  var count = 0;
  return function after() {
    count += 1;
    if (count >= amount) {
      fn.apply(arguments);
    }
  };
};
