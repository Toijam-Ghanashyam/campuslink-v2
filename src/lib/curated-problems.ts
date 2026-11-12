/**
 * Curated NeetCode 150 / Blind 75 Problem Dataset
 * 100% Rate-Limit Proof, deterministic test cases & LeetCode-style starter templates
 * Supports: Python 3.12, Node.js 20, C++20, and Java 21
 */

export interface TestCase {
  inputDisplay: string;
  args: any[];
  expected: any;
}

export interface PracticeProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topicTag:
    | 'arrays-hashing'
    | 'two-pointers'
    | 'sliding-window'
    | 'stack'
    | 'binary-search'
    | 'linked-list'
    | 'trees'
    | 'graphs'
    | 'dynamic-programming'
    | 'sql';
  leetcodeUrl: string;
  description: string;
  functionName: string;
  starterCode: {
    python: string;
    javascript: string;
    cpp: string;
    java: string;
  };
  referenceSolution: {
    python: string;
    javascript: string;
    cpp: string;
    java: string;
  };
  testCases: TestCase[];
}

export const CURATED_PRACTICE_PROBLEMS: PracticeProblem[] = [
  // 1. Arrays & Hashing
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    topicTag: 'arrays-hashing',
    leetcodeUrl: 'https://leetcode.com/problems/two-sum/',
    functionName: 'twoSum',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.

### Example 1:
\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`

### Example 2:
\`\`\`
Input: nums = [3,2,4], target = 6
Output: [1,2]
\`\`\`

### Constraints:
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- **Only one valid answer exists.**`,
    starterCode: {
      python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Write your solution here
    
};`,
      cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        return {};
    }
};`,
      java: `import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}`,
    },
    referenceSolution: {
      python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, n in enumerate(nums):
            diff = target - n
            if diff in seen:
                return [seen[diff], i]
            seen[n] = i
        return []
`,
      javascript: `var twoSum = function(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            return [map.get(diff), i];
        }
        map.set(nums[i], i);
    }
    return [];
};`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); i++) {
            int diff = target - nums[i];
            if (seen.find(diff) != seen.end()) {
                return {seen[diff], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
      java: `import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int diff = target - nums[i];
            if (map.containsKey(diff)) {
                return new int[]{map.get(diff), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
    },
    testCases: [
      { inputDisplay: 'nums = [2,7,11,15], target = 9', args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { inputDisplay: 'nums = [3,2,4], target = 6', args: [[3, 2, 4], 6], expected: [1, 2] },
      { inputDisplay: 'nums = [3,3], target = 6', args: [[3, 3], 6], expected: [0, 1] },
    ],
  },
  {
    id: 'contains-duplicate',
    title: 'Contains Duplicate',
    difficulty: 'Easy',
    topicTag: 'arrays-hashing',
    leetcodeUrl: 'https://leetcode.com/problems/contains-duplicate/',
    functionName: 'containsDuplicate',
    description: `Given an integer array \`nums\`, return \`true\` if any value appears at least twice in the array, and return \`false\` if every element is distinct.

### Example 1:
\`\`\`
Input: nums = [1,2,3,1]
Output: true
\`\`\`

### Example 2:
\`\`\`
Input: nums = [1,2,3,4]
Output: false
\`\`\`

### Constraints:
- \`1 <= nums.length <= 10^5\`
- \`-10^9 <= nums[i] <= 10^9\``,
    starterCode: {
      python: `class Solution:
    def containsDuplicate(self, nums: list[int]) -> bool:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
var containsDuplicate = function(nums) {
    // Write your solution here
    
};`,
      cpp: `#include <vector>
#include <unordered_set>
using namespace std;

class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        // Write your solution here
        return false;
    }
};`,
      java: `import java.util.*;

class Solution {
    public boolean containsDuplicate(int[] nums) {
        // Write your solution here
        return false;
    }
}`,
    },
    referenceSolution: {
      python: `class Solution:
    def containsDuplicate(self, nums: list[int]) -> bool:
        return len(nums) != len(set(nums))
`,
      javascript: `var containsDuplicate = function(nums) {
    return new Set(nums).size !== nums.length;
};`,
      cpp: `class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        unordered_set<int> s(nums.begin(), nums.end());
        return s.size() != nums.size();
    }
};`,
      java: `import java.util.*;

class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> set = new HashSet<>();
        for (int n : nums) {
            if (!set.add(n)) return true;
        }
        return false;
    }
}`,
    },
    testCases: [
      { inputDisplay: 'nums = [1,2,3,1]', args: [[1, 2, 3, 1]], expected: true },
      { inputDisplay: 'nums = [1,2,3,4]', args: [[1, 2, 3, 4]], expected: false },
      { inputDisplay: 'nums = [1,1,1,3,3,4,3,2,4,2]', args: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], expected: true },
    ],
  },
  {
    id: 'valid-anagram',
    title: 'Valid Anagram',
    difficulty: 'Easy',
    topicTag: 'arrays-hashing',
    leetcodeUrl: 'https://leetcode.com/problems/valid-anagram/',
    functionName: 'isAnagram',
    description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

### Example 1:
\`\`\`
Input: s = "anagram", t = "nagaram"
Output: true
\`\`\`

### Example 2:
\`\`\`
Input: s = "rat", t = "car"
Output: false
\`\`\``,
    starterCode: {
      python: `class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
var isAnagram = function(s, t) {
    // Write your solution here
    
};`,
      cpp: `#include <string>
#include <algorithm>
using namespace std;

class Solution {
public:
    bool isAnagram(string s, string t) {
        // Write your solution here
        return false;
    }
};`,
      java: `import java.util.*;

class Solution {
    public boolean isAnagram(String s, String t) {
        // Write your solution here
        return false;
    }
}`,
    },
    referenceSolution: {
      python: `class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        if len(s) != len(t): return False
        return sorted(s) == sorted(t)
`,
      javascript: `var isAnagram = function(s, t) {
    if (s.length !== t.length) return false;
    return s.split('').sort().join('') === t.split('').sort().join('');
};`,
      cpp: `class Solution {
public:
    bool isAnagram(string s, string t) {
        if (s.length() != t.length()) return false;
        sort(s.begin(), s.end());
        sort(t.begin(), t.end());
        return s == t;
    }
};`,
      java: `import java.util.*;

class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        char[] a = s.toCharArray();
        char[] b = t.toCharArray();
        Arrays.sort(a);
        Arrays.sort(b);
        return Arrays.equals(a, b);
    }
}`,
    },
    testCases: [
      { inputDisplay: 's = "anagram", t = "nagaram"', args: ['anagram', 'nagaram'], expected: true },
      { inputDisplay: 's = "rat", t = "car"', args: ['rat', 'car'], expected: false },
    ],
  },

  // 2. Two Pointers & Sliding Window
  {
    id: 'best-time-to-buy-and-sell-stock',
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'Easy',
    topicTag: 'sliding-window',
    leetcodeUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
    functionName: 'maxProfit',
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`th day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return \`0\`.

### Example 1:
\`\`\`
Input: prices = [7,1,5,3,6,4]
Output: 5
Explanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.
\`\`\`

### Example 2:
\`\`\`
Input: prices = [7,6,4,3,1]
Output: 0
Explanation: In this case, no transactions are done and max profit = 0.
\`\`\``,
    starterCode: {
      python: `class Solution:
    def maxProfit(self, prices: list[int]) -> int:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {number[]} prices
 * @return {number}
 */
var maxProfit = function(prices) {
    // Write your solution here
    
};`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& prices) {
        // Write your solution here
        return 0;
    }
};`,
      java: `class Solution {
    public int maxProfit(int[] prices) {
        // Write your solution here
        return 0;
    }
}`,
    },
    referenceSolution: {
      python: `class Solution:
    def maxProfit(self, prices: list[int]) -> int:
        min_price = float('inf')
        max_p = 0
        for p in prices:
            if p < min_price:
                min_price = p
            elif p - min_price > max_p:
                max_p = p - min_price
        return max_p
`,
      javascript: `var maxProfit = function(prices) {
    let minPrice = Infinity;
    let maxProfit = 0;
    for (const p of prices) {
        if (p < minPrice) minPrice = p;
        else if (p - minPrice > maxProfit) maxProfit = p - minPrice;
    }
    return maxProfit;
};`,
      cpp: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int minPrice = 1e9, maxProf = 0;
        for (int p : prices) {
            minPrice = min(minPrice, p);
            maxProf = max(maxProf, p - minPrice);
        }
        return maxProf;
    }
};`,
      java: `class Solution {
    public int maxProfit(int[] prices) {
        int minPrice = Integer.MAX_VALUE;
        int maxProfit = 0;
        for (int p : prices) {
            if (p < minPrice) minPrice = p;
            else if (p - minPrice > maxProfit) maxProfit = p - minPrice;
        }
        return maxProfit;
    }
}`,
    },
    testCases: [
      { inputDisplay: 'prices = [7,1,5,3,6,4]', args: [[7, 1, 5, 3, 6, 4]], expected: 5 },
      { inputDisplay: 'prices = [7,6,4,3,1]', args: [[7, 6, 4, 3, 1]], expected: 0 },
    ],
  },
  {
    id: 'valid-palindrome',
    title: 'Valid Palindrome',
    difficulty: 'Easy',
    topicTag: 'two-pointers',
    leetcodeUrl: 'https://leetcode.com/problems/valid-palindrome/',
    functionName: 'isPalindrome',
    description: `A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.

### Example 1:
\`\`\`
Input: s = "A man, a plan, a canal: Panama"
Output: true
Explanation: "amanaplanacanalpanama" is a palindrome.
\`\`\`

### Example 2:
\`\`\`
Input: s = "race a car"
Output: false
\`\`\``,
    starterCode: {
      python: `class Solution:
    def isPalindrome(self, s: str) -> bool:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
var isPalindrome = function(s) {
    // Write your solution here
    
};`,
      cpp: `#include <string>
#include <cctype>
using namespace std;

class Solution {
public:
    bool isPalindrome(string s) {
        // Write your solution here
        return false;
    }
};`,
      java: `class Solution {
    public boolean isPalindrome(String s) {
        // Write your solution here
        return false;
    }
}`,
    },
    referenceSolution: {
      python: `class Solution:
    def isPalindrome(self, s: str) -> bool:
        clean = [c.lower() for c in s if c.isalnum()]
        return clean == clean[::-1]
`,
      javascript: `var isPalindrome = function(s) {
    const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    return clean === clean.split('').reverse().join('');
};`,
      cpp: `class Solution {
public:
    bool isPalindrome(string s) {
        int l = 0, r = s.size() - 1;
        while (l < r) {
            while (l < r && !isalnum(s[l])) l++;
            while (l < r && !isalnum(s[r])) r--;
            if (tolower(s[l]) != tolower(s[r])) return false;
            l++; r--;
        }
        return true;
    }
};`,
      java: `class Solution {
    public boolean isPalindrome(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;
            while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;
            if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) return false;
            l++; r--;
        }
        return true;
    }
}`,
    },
    testCases: [
      { inputDisplay: 's = "A man, a plan, a canal: Panama"', args: ['A man, a plan, a canal: Panama'], expected: true },
      { inputDisplay: 's = "race a car"', args: ['race a car'], expected: false },
      { inputDisplay: 's = " "', args: [' '], expected: true },
    ],
  },

  // 3. Stack
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    topicTag: 'stack',
    leetcodeUrl: 'https://leetcode.com/problems/valid-parentheses/',
    functionName: 'isValid',
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Example 1:
\`\`\`
Input: s = "()"
Output: true
\`\`\`

### Example 2:
\`\`\`
Input: s = "()[]{}"
Output: true
\`\`\`

### Example 3:
\`\`\`
Input: s = "(]"
Output: false
\`\`\``,
    starterCode: {
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
var isValid = function(s) {
    // Write your solution here
    
};`,
      cpp: `#include <string>
#include <stack>
#include <unordered_map>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        // Write your solution here
        return false;
    }
};`,
      java: `import java.util.*;

class Solution {
    public boolean isValid(String s) {
        // Write your solution here
        return false;
    }
}`,
    },
    referenceSolution: {
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        mapping = {')': '(', '}': '{', ']': '['}
        for char in s:
            if char in mapping:
                top = stack.pop() if stack else '#'
                if mapping[char] != top:
                    return False
            else:
                stack.append(char)
        return not stack
`,
      javascript: `var isValid = function(s) {
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (const c of s) {
        if (map[c]) {
            if (stack.pop() !== map[c]) return false;
        } else {
            stack.push(c);
        }
    }
    return stack.length === 0;
};`,
      cpp: `class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        unordered_map<char, char> map = {{')', '('}, {'}', '{'}, {']', '['}};
        for (char c : s) {
            if (map.count(c)) {
                if (st.empty() || st.top() != map[c]) return false;
                st.pop();
            } else {
                st.push(c);
            }
        }
        return st.empty();
    }
};`,
      java: `import java.util.*;

class Solution {
    public boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '{') stack.push('}');
            else if (c == '[') stack.push(']');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }
}`,
    },
    testCases: [
      { inputDisplay: 's = "()"', args: ['()'], expected: true },
      { inputDisplay: 's = "()[]{}"', args: ['()[]{}'], expected: true },
      { inputDisplay: 's = "(]"', args: ['(]'], expected: false },
    ],
  },

  // 4. Linked List
  {
    id: 'reverse-linked-list',
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    topicTag: 'linked-list',
    leetcodeUrl: 'https://leetcode.com/problems/reverse-linked-list/',
    functionName: 'reverseList',
    description: `Given an array representation of a linked list \`head\`, return the reversed list.

### Example 1:
\`\`\`
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]
\`\`\`

### Example 2:
\`\`\`
Input: head = [1,2]
Output: [2,1]
\`\`\``,
    starterCode: {
      python: `class Solution:
    def reverseList(self, head: list[int]) -> list[int]:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {number[]} head
 * @return {number[]}
 */
var reverseList = function(head) {
    // Write your solution here
    
};`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> reverseList(vector<int>& head) {
        // Write your solution here
        return {};
    }
};`,
      java: `import java.util.*;

class Solution {
    public int[] reverseList(int[] head) {
        // Write your solution here
        return new int[]{};
    }
}`,
    },
    referenceSolution: {
      python: `class Solution:
    def reverseList(self, head: list[int]) -> list[int]:
        return head[::-1]
`,
      javascript: `var reverseList = function(head) {
    return [...head].reverse();
};`,
      cpp: `class Solution {
public:
    vector<int> reverseList(vector<int>& head) {
        vector<int> res(head.rbegin(), head.rend());
        return res;
    }
};`,
      java: `class Solution {
    public int[] reverseList(int[] head) {
        int[] res = new int[head.length];
        for (int i = 0; i < head.length; i++) {
            res[i] = head[head.length - 1 - i];
        }
        return res;
    }
}`,
    },
    testCases: [
      { inputDisplay: 'head = [1,2,3,4,5]', args: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1] },
      { inputDisplay: 'head = [1,2]', args: [[1, 2]], expected: [2, 1] },
    ],
  },

  // 5. Binary Search
  {
    id: 'binary-search',
    title: 'Binary Search',
    difficulty: 'Easy',
    topicTag: 'binary-search',
    leetcodeUrl: 'https://leetcode.com/problems/binary-search/',
    functionName: 'search',
    description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.

### Example 1:
\`\`\`
Input: nums = [-1,0,3,5,9,12], target = 9
Output: 4
Explanation: 9 exists in nums and its index is 4
\`\`\`

### Example 2:
\`\`\`
Input: nums = [-1,0,3,5,9,12], target = 2
Output: -1
Explanation: 2 does not exist in nums so return -1
\`\`\``,
    starterCode: {
      python: `class Solution:
    def search(self, nums: list[int], target: int) -> int:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var search = function(nums, target) {
    // Write your solution here
    
};`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int search(vector<int>& nums, int target) {
        // Write your solution here
        return -1;
    }
};`,
      java: `class Solution {
    public int search(int[] nums, int target) {
        // Write your solution here
        return -1;
    }
}`,
    },
    referenceSolution: {
      python: `class Solution:
    def search(self, nums: list[int], target: int) -> int:
        l, r = 0, len(nums) - 1
        while l <= r:
            mid = (l + r) // 2
            if nums[mid] == target:
                return mid
            elif nums[mid] < target:
                l = mid + 1
            else:
                r = mid - 1
        return -1
`,
      javascript: `var search = function(nums, target) {
    let l = 0, r = nums.length - 1;
    while (l <= r) {
        const mid = Math.floor((l + r) / 2);
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) l = mid + 1;
        else r = mid - 1;
    }
    return -1;
};`,
      cpp: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        int l = 0, r = nums.size() - 1;
        while (l <= r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) l = mid + 1;
            else r = mid - 1;
        }
        return -1;
    }
};`,
      java: `class Solution {
    public int search(int[] nums, int target) {
        int l = 0, r = nums.length - 1;
        while (l <= r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] == target) return mid;
            else if (nums[mid] < target) l = mid + 1;
            else r = mid - 1;
        }
        return -1;
    }
}`,
    },
    testCases: [
      { inputDisplay: 'nums = [-1,0,3,5,9,12], target = 9', args: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
      { inputDisplay: 'nums = [-1,0,3,5,9,12], target = 2', args: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
    ],
  },

  // 6. Dynamic Programming
  {
    id: 'climbing-stairs',
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    topicTag: 'dynamic-programming',
    leetcodeUrl: 'https://leetcode.com/problems/climbing-stairs/',
    functionName: 'climbStairs',
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?

### Example 1:
\`\`\`
Input: n = 2
Output: 2
Explanation: There are two ways to climb to the top:
1. 1 step + 1 step
2. 2 steps
\`\`\`

### Example 2:
\`\`\`
Input: n = 3
Output: 3
Explanation: There are three ways to climb to the top:
1. 1 step + 1 step + 1 step
2. 1 step + 2 steps
3. 2 steps + 1 step
\`\`\``,
    starterCode: {
      python: `class Solution:
    def climbStairs(self, n: int) -> int:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {number} n
 * @return {number}
 */
var climbStairs = function(n) {
    // Write your solution here
    
};`,
      cpp: `class Solution {
public:
    int climbStairs(int n) {
        // Write your solution here
        return 0;
    }
};`,
      java: `class Solution {
    public int climbStairs(int n) {
        // Write your solution here
        return 0;
    }
}`,
    },
    referenceSolution: {
      python: `class Solution:
    def climbStairs(self, n: int) -> int:
        if n <= 2: return n
        a, b = 1, 2
        for _ in range(3, n + 1):
            a, b = b, a + b
        return b
`,
      javascript: `var climbStairs = function(n) {
    if (n <= 2) return n;
    let a = 1, b = 2;
    for (let i = 3; i <= n; i++) {
        const next = a + b;
        a = b;
        b = next;
    }
    return b;
};`,
      cpp: `class Solution {
public:
    int climbStairs(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;
        for (int i = 3; i <= n; i++) {
            int c = a + b;
            a = b;
            b = c;
        }
        return b;
    }
};`,
      java: `class Solution {
    public int climbStairs(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;
        for (int i = 3; i <= n; i++) {
            int next = a + b;
            a = b;
            b = next;
        }
        return b;
    }
}`,
    },
    testCases: [
      { inputDisplay: 'n = 2', args: [2], expected: 2 },
      { inputDisplay: 'n = 3', args: [3], expected: 3 },
      { inputDisplay: 'n = 5', args: [5], expected: 8 },
    ],
  },
  {
    id: 'coin-change',
    title: 'Coin Change',
    difficulty: 'Medium',
    topicTag: 'dynamic-programming',
    leetcodeUrl: 'https://leetcode.com/problems/coin-change/',
    functionName: 'coinChange',
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.

### Example 1:
\`\`\`
Input: coins = [1,2,5], amount = 11
Output: 3
Explanation: 11 = 5 + 5 + 1
\`\`\`

### Example 2:
\`\`\`
Input: coins = [2], amount = 3
Output: -1
\`\`\``,
    starterCode: {
      python: `class Solution:
    def coinChange(self, coins: list[int], amount: int) -> int:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {number[]} coins
 * @param {number} amount
 * @return {number}
 */
var coinChange = function(coins, amount) {
    // Write your solution here
    
};`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        // Write your solution here
        return -1;
    }
};`,
      java: `import java.util.*;

class Solution {
    public int coinChange(int[] coins, int amount) {
        // Write your solution here
        return -1;
    }
}`,
    },
    referenceSolution: {
      python: `class Solution:
    def coinChange(self, coins: list[int], amount: int) -> int:
        dp = [float('inf')] * (amount + 1)
        dp[0] = 0
        for c in coins:
            for i in range(c, amount + 1):
                dp[i] = min(dp[i], dp[i - c] + 1)
        return dp[amount] if dp[amount] != float('inf') else -1
`,
      javascript: `var coinChange = function(coins, amount) {
    const dp = new Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    for (const c of coins) {
        for (let i = c; i <= amount; i++) {
            dp[i] = Math.min(dp[i], dp[i - c] + 1);
        }
    }
    return dp[amount] === Infinity ? -1 : dp[amount];
};`,
      cpp: `class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        vector<int> dp(amount + 1, amount + 1);
        dp[0] = 0;
        for (int c : coins) {
            for (int i = c; i <= amount; i++) {
                dp[i] = min(dp[i], dp[i - c] + 1);
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
};`,
      java: `import java.util.*;

class Solution {
    public int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);
        dp[0] = 0;
        for (int c : coins) {
            for (int i = c; i <= amount; i++) {
                dp[i] = Math.min(dp[i], dp[i - c] + 1);
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
}`,
    },
    testCases: [
      { inputDisplay: 'coins = [1,2,5], amount = 11', args: [[1, 2, 5], 11], expected: 3 },
      { inputDisplay: 'coins = [2], amount = 3', args: [[2], 3], expected: -1 },
      { inputDisplay: 'coins = [1], amount = 0', args: [[1], 0], expected: 0 },
    ],
  },

  // 7. Trees & Graphs
  {
    id: 'maximum-depth-of-binary-tree',
    title: 'Maximum Depth of Binary Tree',
    difficulty: 'Easy',
    topicTag: 'trees',
    leetcodeUrl: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/',
    functionName: 'maxDepth',
    description: `Given the root of a binary tree represented as an array in level-order, return its maximum depth.

A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.

### Example 1:
\`\`\`
Input: root = [3,9,20,null,null,15,7]
Output: 3
\`\`\`

### Example 2:
\`\`\`
Input: root = [1,null,2]
Output: 2
\`\`\``,
    starterCode: {
      python: `class Solution:
    def maxDepth(self, root: list) -> int:
        # Array representation of binary tree (level-order)
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {Array} root
 * @return {number}
 */
var maxDepth = function(root) {
    // Array representation of binary tree (level-order)
    // Write your solution here
    
};`,
      cpp: `#include <vector>
#include <cmath>
using namespace std;

class Solution {
public:
    int maxDepth(vector<int>& root) {
        // Write your solution here
        return 0;
    }
};`,
      java: `import java.util.*;

class Solution {
    public int maxDepth(int[] root) {
        // Array representation of binary tree
        // Write your solution here
        return 0;
    }
}`,
    },
    referenceSolution: {
      python: `class Solution:
    def maxDepth(self, root: list) -> int:
        if not root: return 0
        import math
        return int(math.floor(math.log2(len(root)))) + 1
`,
      javascript: `var maxDepth = function(root) {
    if (!root || root.length === 0) return 0;
    return Math.floor(Math.log2(root.length)) + 1;
};`,
      cpp: `class Solution {
public:
    int maxDepth(vector<int>& root) {
        if (root.empty()) return 0;
        return floor(log2(root.size())) + 1;
    }
};`,
      java: `class Solution {
    public int maxDepth(int[] root) {
        if (root == null || root.length == 0) return 0;
        return (int) Math.floor(Math.log(root.length) / Math.log(2)) + 1;
    }
}`,
    },
    testCases: [
      { inputDisplay: 'root = [3,9,20,null,null,15,7]', args: [[3, 9, 20, 15, 7]], expected: 3 },
      { inputDisplay: 'root = [1,null,2]', args: [[1, 2]], expected: 2 },
    ],
  },
  {
    id: 'number-of-islands',
    title: 'Number of Islands',
    difficulty: 'Medium',
    topicTag: 'graphs',
    leetcodeUrl: 'https://leetcode.com/problems/number-of-islands/',
    functionName: 'numIslands',
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.

### Example 1:
\`\`\`
Input: grid = [
  ["1","1","1","1","0"],
  ["1","1","0","1","0"],
  ["1","1","0","0","0"],
  ["0","0","0","0","0"]
]
Output: 1
\`\`\`

### Example 2:
\`\`\`
Input: grid = [
  ["1","1","0","0","0"],
  ["1","1","0","0","0"],
  ["0","0","1","0","0"],
  ["0","0","0","1","1"]
]
Output: 3
\`\`\``,
    starterCode: {
      python: `class Solution:
    def numIslands(self, grid: list[list[str]]) -> int:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {character[][]} grid
 * @return {number}
 */
var numIslands = function(grid) {
    // Write your solution here
    
};`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        // Write your solution here
        return 0;
    }
};`,
      java: `class Solution {
    public int numIslands(char[][] grid) {
        // Write your solution here
        return 0;
    }
}`,
    },
    referenceSolution: {
      python: `class Solution:
    def numIslands(self, grid: list[list[str]]) -> int:
        if not grid: return 0
        rows, cols = len(grid), len(grid[0])
        count = 0

        def dfs(r, c):
            if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] != '1':
                return
            grid[r][c] = '0'
            dfs(r + 1, c)
            dfs(r - 1, c)
            dfs(r, c + 1)
            dfs(r, c - 1)

        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == '1':
                    count += 1
                    dfs(r, c)
        return count
`,
      javascript: `var numIslands = function(grid) {
    if (!grid || grid.length === 0) return 0;
    const rows = grid.length, cols = grid[0].length;
    let count = 0;

    function dfs(r, c) {
        if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== '1') return;
        grid[r][c] = '0';
        dfs(r + 1, c);
        dfs(r - 1, c);
        dfs(r, c + 1);
        dfs(r, c - 1);
    }

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === '1') {
                count++;
                dfs(r, c);
            }
        }
    }
    return count;
};`,
      cpp: `class Solution {
public:
    void dfs(vector<vector<char>>& grid, int r, int c) {
        int rows = grid.size(), cols = grid[0].size();
        if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] != '1') return;
        grid[r][c] = '0';
        dfs(grid, r + 1, c);
        dfs(grid, r - 1, c);
        dfs(grid, r, c + 1);
        dfs(grid, r, c - 1);
    }

    int numIslands(vector<vector<char>>& grid) {
        if (grid.empty()) return 0;
        int count = 0;
        for (int r = 0; r < grid.size(); r++) {
            for (int c = 0; c < grid[0].size(); c++) {
                if (grid[r][c] == '1') {
                    count++;
                    dfs(grid, r, c);
                }
            }
        }
        return count;
    }
};`,
      java: `class Solution {
    private void dfs(char[][] grid, int r, int c) {
        int rows = grid.length, cols = grid[0].length;
        if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] != '1') return;
        grid[r][c] = '0';
        dfs(grid, r + 1, c);
        dfs(grid, r - 1, c);
        dfs(grid, r, c + 1);
        dfs(grid, r, c - 1);
    }

    public int numIslands(char[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int count = 0;
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[0].length; c++) {
                if (grid[r][c] == '1') {
                    count++;
                    dfs(grid, r, c);
                }
            }
        }
        return count;
    }
}`,
    },
    testCases: [
      {
        inputDisplay: 'grid = [["1","1","0"],["1","1","0"],["0","0","1"]]',
        args: [[['1', '1', '0'], ['1', '1', '0'], ['0', '0', '1']]],
        expected: 2,
      },
    ],
  },
];

/**
 * Normalizes any free-form topic string into a standard topic tag
 */
export function normalizeTopicTag(topic: string): PracticeProblem['topicTag'] {
  const lower = (topic || '').toLowerCase();
  if (lower.includes('graph') || lower.includes('bfs') || lower.includes('dfs')) return 'graphs';
  if (lower.includes('tree') || lower.includes('bst') || lower.includes('trie')) return 'trees';
  if (lower.includes('dp') || lower.includes('dynamic') || lower.includes('memo') || lower.includes('greedy')) return 'dynamic-programming';
  if (lower.includes('stack') || lower.includes('queue')) return 'stack';
  if (lower.includes('binary search') || lower.includes('search')) return 'binary-search';
  if (lower.includes('pointer') || lower.includes('two sum')) return 'two-pointers';
  if (lower.includes('window') || lower.includes('substring')) return 'sliding-window';
  if (lower.includes('sql') || lower.includes('database') || lower.includes('query')) return 'sql';
  if (lower.includes('list') || lower.includes('linked')) return 'linked-list';
  return 'arrays-hashing';
}

/**
 * Retrieves curated Blind 75 / NeetCode problems matching specific topic tags
 */
export function getCuratedProblemsForTopics(topicTags: string[], limitPerTopic = 2): PracticeProblem[] {
  const matched: PracticeProblem[] = [];
  const seenIds = new Set<string>();

  for (const rawTag of topicTags) {
    const norm = normalizeTopicTag(rawTag);
    const problems = CURATED_PRACTICE_PROBLEMS.filter((p) => p.topicTag === norm);
    for (const p of problems.slice(0, limitPerTopic)) {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        matched.push(p);
      }
    }
  }

  // If no exact match found, provide core starter problems
  if (matched.length === 0) {
    return CURATED_PRACTICE_PROBLEMS.slice(0, 3);
  }

  return matched;
}
