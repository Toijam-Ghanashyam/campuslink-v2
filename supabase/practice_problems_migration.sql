-- ==============================================================================
-- CAMPUSLINK ENTERPRISE: CURATED LEETCODE PRACTICE PROBLEMS TABLE & SEED
-- ==============================================================================

CREATE TABLE IF NOT EXISTS practice_problems (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL, -- 'Easy', 'Medium', 'Hard'
  topic_tag TEXT NOT NULL,  -- 'arrays-hashing', 'dynamic-programming', 'graphs', etc.
  leetcode_url TEXT NOT NULL,
  function_name TEXT NOT NULL,
  description TEXT NOT NULL,
  starter_code JSONB NOT NULL,
  test_cases JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance index for topic tag queries
CREATE INDEX IF NOT EXISTS idx_practice_problems_topic_tag 
ON practice_problems (topic_tag);

CREATE INDEX IF NOT EXISTS idx_practice_problems_difficulty 
ON practice_problems (difficulty);

-- Optional Seed Data for Blind 75 / NeetCode 150 Core Set
INSERT INTO practice_problems (id, title, difficulty, topic_tag, leetcode_url, function_name, description, starter_code, test_cases)
VALUES
(
  'two-sum',
  'Two Sum',
  'Easy',
  'arrays-hashing',
  'https://leetcode.com/problems/two-sum/',
  'twoSum',
  'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
  '{"python": "class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        pass", "javascript": "var twoSum = function(nums, target) {};", "cpp": "class Solution { public: vector<int> twoSum(vector<int>& nums, int target) {} };"}'::jsonb,
  '[{"inputDisplay": "nums = [2,7,11,15], target = 9", "args": [[2, 7, 11, 15], 9], "expected": [0, 1]}, {"inputDisplay": "nums = [3,2,4], target = 6", "args": [[3, 2, 4], 6], "expected": [1, 2]}]'::jsonb
),
(
  'best-time-to-buy-and-sell-stock',
  'Best Time to Buy and Sell Stock',
  'Easy',
  'sliding-window',
  'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
  'maxProfit',
  'You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.',
  '{"python": "class Solution:\n    def maxProfit(self, prices: list[int]) -> int:\n        pass", "javascript": "var maxProfit = function(prices) {};", "cpp": "class Solution { public: int maxProfit(vector<int>& prices) {} };"}'::jsonb,
  '[{"inputDisplay": "prices = [7,1,5,3,6,4]", "args": [[7, 1, 5, 3, 6, 4]], "expected": 5}, {"inputDisplay": "prices = [7,6,4,3,1]", "args": [[7, 6, 4, 3, 1]], "expected": 0}]'::jsonb
),
(
  'valid-parentheses',
  'Valid Parentheses',
  'Easy',
  'stack',
  'https://leetcode.com/problems/valid-parentheses/',
  'isValid',
  'Given a string s containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid.',
  '{"python": "class Solution:\n    def isValid(self, s: str) -> bool:\n        pass", "javascript": "var isValid = function(s) {};", "cpp": "class Solution { public: bool isValid(string s) {} };"}'::jsonb,
  '[{"inputDisplay": "s = \"()\"", "args": ["()"], "expected": true}, {"inputDisplay": "s = \"()[]{}\"", "args": ["()[]{}"], "expected": true}, {"inputDisplay": "s = \"(]\"", "args": ["(]"], "expected": false}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

