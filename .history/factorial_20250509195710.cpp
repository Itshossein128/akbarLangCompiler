#include <iostream>
#include <string>

using namespace std;
int main() {
  string t0 = "Enter a number to calculate factorial: ";
  cout << t0 << endl;
  int n;
  cin >> n;
  int factorial = 1;
  int i = 1;
L0:
  if (!(i <= n)) goto L1;
  {
    factorial = factorial * i;
    i = i + 1;
  }
  goto L0;
L1:
  cout << "Factorial of " << n << " is: " << factorial << endl;
  return 0;
}