class TestEquals {}

async function equalsEqualsTokenImplicitCast() {
    "use speedyjs";

    let four = 4;

    four == 4.0;
    new TestEquals() == undefined;
    undefined == new TestEquals();
}
