# IBZVesting
Vesting per token IBZ

### Very important parameters:

- Release Date and Time: initial date and time from where you can count time, normally set in the future respect to present date and time

- Vesting per box: every box will have the following parameters:

    - release percentage at initial month or, if delay present, the first available month after delay 

    - release percentage for following months

    - delay, in months

So, for example, a vesting type made like this: 

    `VestingType(4166666666666666667, 4166666666666666667, 6)` 

means that all token sent to this "box" will be released after 6 months at a constant rate of 4.16667% per month, or 

    `VestingType(100000000000000000000, 0, 12)` 

means that all tokens sent to this "box" will be released all after 12 months from the released date and time


