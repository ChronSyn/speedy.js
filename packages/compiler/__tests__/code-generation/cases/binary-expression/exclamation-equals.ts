class NotEqualsTest {}

async function exclamationEqualsToken() {
    "use speedyjs";

    let four = 4;
    let threePointFour = 3.4;
    let trueValue = true;

    four != 4;
    threePointFour != 3.4;
    trueValue != true;
    undefined != undefined;
    new NotEqualsTest() != new NotEqualsTest();
}
