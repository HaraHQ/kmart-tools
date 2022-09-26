const setLOByPageLimit = (page, limit) => {
  const result = { L: 10, O: 0 };
  if (limit > 10) {
    result.L = limit;
  }
  if (page > 1) {
    result.O = result.L * page;
  }

  return result;
}

export default setLOByPageLimit;