Your profile must have at least 3 sections of content at your choice, for example:

    Basic user identification
    XP amount
    level
    grades
    audits
    skills

Here are some possible combinations for the creation of the graphs:

    XP earned in a time period (progress over time)
    Levels over time
    XP earned by project
    Audit ratio
    Projects PASS and FAIL ratio
    Piscine (JS/Go) stats
        PASS and FAIL ratio
        Attempts for each exercise

Here are the list of tables that you are allowed to query (it will be only provided the columns present on the tables):

    User table:

    This table will have information about the user
    id 	login
    1 	person1
    2 	person2
    3 	person3

    Transactions table:

    This table will give you access to XP and audits ratio
    id 	type 	amount 	objectId 	userId 	createdAt 	path
    1 	xp 	234 	42 	1 	2021-07-26T13:04:02.301092+00:00 	/madere/div-01/graphql
    2 	xp 	1700 	2 	2 	2021-07-26T13:04:02.301092+00:00 	/madere/div-01/graphql
    3 	xp 	175 	64 	3 	2021-07-26T13:04:02.301092+00:00 	/madere/div-01/graphql

    Progress table:
    id 	userId 	objectId 	grade 	createdAt 	updatedAt 	path
    1 	1 	3001 	1 	2021-07-26T13:04:02.301092+00:00 	2021-07-26T13:04:02.301092+00:00 	/madere/piscine-go/quest-01
    2 	2 	198 	0 	2021-07-26T13:04:02.301092+00:00 	2021-07-26T13:04:02.301092+00:00 	/madere/piscine-go/quest-01
    3 	3 	177 	1 	2021-07-26T13:04:02.301092+00:00 	2021-07-26T13:04:02.301092+00:00 	/madere/piscine-go/quest-01

    Results table:

    Both progress and result table will give you the student progression
    id 	objectId 	userId 	grade 	progressId 	type 	createdAt 	updatedAt 	path
    1 	3 	1 	0 	58 		2021-07-26T13:04:02.301092+00:00 	2021-07-26T13:04:02.301092+00:00 	/madere/div-01/graphql
    2 	23 	1 	0 	58 		2021-07-26T13:04:02.301092+00:00 	2021-07-26T13:04:02.301092+00:00 	/madere/div-01/graphql
    3 	41 	6 	1 	58 		2021-07-26T13:04:02.301092+00:00 	2021-07-26T13:04:02.301092+00:00 	/madere/div-01/graphql

    Object table:

    This table will give you information about all objects (exercises/projects)
    id 	name 	type 	childrenAttrs
    1 	0 	exercise 	{}
    2 	0 	project 	{}
    3 	1 	exercise 	{}
