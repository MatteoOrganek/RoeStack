// Get the functions in the db.js file
const db = require("../db");
const Community = require("./community");
const Post = require("./post");
const User = require("./user");
const Comment = require("./comment");
const Utils = require("../../utils");


const globalImagePathCache = {};
// TODO Convert to Singleton or Observer
/**
 * The Content Manager
 */
class ContentManager {

    static #instance = null;

    constructor(session) {
        this.imagePathCache = globalImagePathCache;

        if (ContentManager.#instance) {
            // If instance exists, update the session and return it
            ContentManager.#instance.session = session;
            return ContentManager.#instance;
        }

        // Initialize the one-time data
        this.session = session;
        
        // Save this instance
        ContentManager.#instance = this;
    }

    // Static helper to get the manager without new
    static getInstance(session) {
        return new ContentManager(session);
    }

    async update({
        getStatistics = true,
        getLatestPosts = false, 
        getUserList = false,
        getAllCommunities = false
    } = {}) { 

        Utils.log("- - - - - - - - - Updating layout...")

        var totalPosts, totalUsers, totalComments, mostHelpful, topCommunities,
            latestPosts, userList, communityList, popularPosts;

        // Get all statistics
        if (getStatistics)  totalPosts       = await this.getTotalPosts();
        if (getStatistics)  totalUsers       = await this.getTotalUsers();
        if (getStatistics)  totalComments    = await this.getTotalComments();
        if (getStatistics)  mostHelpful      = await this.getMostHelpful();
        if (getStatistics)  topCommunities   = await this.getTopCommunities();
        if (getStatistics)  {
            // this.session.user is not an instance of user anymore, hence the user is loaded again to update any new attributes.
            this.session.user = await new User().load(this.session.user.id, this)
        }

        // Get latest post sorted by created_at descending
        if (getLatestPosts) latestPosts      = await this.getPosts();

        // Get all users sorted by mods first
        if (getUserList) userList = await this.getUsersList();

        // Get all communities sorted by oldest first
        if (getAllCommunities) communityList = await this.getAllCommunities();

        
        // Utils.log("- - - - - - - - - Layout Updated.")

        return new Content(
            totalPosts, totalUsers, totalComments, mostHelpful, topCommunities,
            latestPosts, userList, communityList, popularPosts, this.session
        );    

    }

    async getPosts({
        userID = -1,
        communityID = -1,
        sortByLatest = true,
        sortByForYou = false,
        sortByPopularity = false,
        reverse = false,
        search = ''
    } = {}) {
        const params = [];
        const sortOrder = reverse ? "ASC" : "DESC";

        // --- WHERE / JOIN clause based on filters ---
        let whereClause = "";
        let groupByClause = "";

        if (sortByPopularity) {
            whereClause   = "LEFT JOIN vote ON vote.post_id = posts.id";
            groupByClause = "GROUP BY posts.id";
        } else if (userID !== -1 && communityID !== -1) {
            whereClause = "WHERE user_id = ? AND community_id = ?";
            params.push(userID, communityID);
        } else if (sortByForYou && userID !== -1) {
            whereClause = "WHERE community_id IN (SELECT community_id FROM userFollowCommunity WHERE user_id = ?)";
            params.push(userID);
        } else if (userID !== -1) {
            whereClause = "WHERE user_id = ?";
            params.push(userID);
        } else if (communityID !== -1) {
            whereClause = "WHERE community_id = ?";
            params.push(communityID);
        }

        // --- Search clause: WHERE if no prior WHERE exists, otherwise AND ---
        let searchClause = "";
        if (search !== '') {
            const needsWhere = whereClause === "" || sortByPopularity;
            search = `%${search}%`
            searchClause = `${needsWhere ? "WHERE" : "AND"} posts.title LIKE ?`;
            params.push(search);
        }

        // --- ORDER BY clause ---
        const orderByClause = sortByPopularity
            ? "ORDER BY COUNT(vote.post_id)"
            : "ORDER BY created_at";

        // --- Final query ---
        const sql = `SELECT posts.id FROM posts ${whereClause} ${searchClause} ${groupByClause} ${orderByClause} ${sortOrder}`;
        console.log(params)
        console.log("SQL:", sql);

        const results = await db.query(sql, params);

        const postPromises = results.map(res => new Post().load(res.id, this));
        return Promise.all(postPromises);
    }
    async getAmountOfPosts({
        userID = -1,
        communityID = -1
    } = {}) { 
        var sql;
        var results;

        var userNotSelected = userID === -1;
        var communityNotSelected = communityID === -1;

        if (userNotSelected && communityNotSelected) {
            // Get count of all posts 
            sql = `
                SELECT count(id) as count 
                FROM posts
            `;
            results = await db.query(sql, null);
        } else if (userNotSelected) {
            // Get count of all posts related to a specific community
            sql = `
                SELECT count(id) 
                FROM posts 
                WHERE community_id = ?
            `;
            results = await db.query(sql, [communityID]);
        } else if (communityNotSelected) {
            // Get count of all posts related to a specific user 
            sql = `
                SELECT count(id) 
                FROM posts 
                WHERE user_id = ?
            `;
            results = await db.query(sql, [userID]);
        }

        return results[0].id;
    }

    
    async getUsersList() {
        // Get all users, ordering it by wether it is a mod or not
        const sql = `
            SELECT id 
            FROM users 
            ORDER BY is_mod DESC
        `;

        const results = await db.query(sql, null);
        var users = [];
        var user;
        for (let i = 0; i < results.length; i++) {
            user = await new User().load(results[i].id, this);
            users.push(user);
        }
        return users;
    }
    

    async getTopCommunities() {
        // TODO Get all communities sorted by amount of users DESC
        const sql = `
            SELECT id 
            FROM communities 
            ORDER BY created_at ASC 
            LIMIT 5
        `;

    const results = await db.query(sql, null);
    var communities = [];
    var community;
    for (let i = 0; i < results.length; i++) {
      community = await new Community().load(results[i].id, this);
      communities.push(community);
    }
    return communities;
  }

    async getAllCommunities() {
        // Get all communities sorted by oldest first
        const sql = `
            SELECT id 
            FROM communities 
            ORDER BY created_at ASC
        `;

    const results = await db.query(sql, null);
    var communities = [];
    var community;
    for (let i = 0; i < results.length; i++) {
      community = await new Community().load(results[i].id, this);
      communities.push(community);
    }
    return communities;
  }

    async getTotalPosts() {
        const sql = `
            SELECT count(id) as count 
            FROM posts
        `;
        const results = await db.query(sql, null);
        return results[0].count
    }

    async getTotalUsers() {
        const sql = `
            SELECT count(id) as count 
            FROM users
        `;
        const results = await db.query(sql, null);
        return results[0].count
    }

    async getTotalComments() {
        const sql = `
            SELECT count(id) as count 
            FROM comments
        `;
        const results = await db.query(sql, null);
        return results[0].count
    }

    async getMostHelpful() {
        // Select top five users that have the most votes (if no votes have been found, coalesce (default) to 0)
        // We use the sum of all the +1 and -1 based on the boolean named positive (0 is mapped to -1 and 1 is mapped to +1) 
        const sql = `
            SELECT u.id, COALESCE(SUM(v.positive * 2 - 1), 0) AS count 

            FROM users u 
            LEFT JOIN posts p ON p.user_id = u.id 
            LEFT JOIN vote v ON v.post_id = p.id

            WHERE v.post_id = p.id AND p.user_id = u.id
            GROUP BY u.id 
            ORDER BY count DESC 
            LIMIT 5
        `;
        const results = await db.query(sql, null);
        var users = [];
        var user;
        for (let i = 0; i < results.length; i++) {
            user = await new User().load(results[i].id, this);
            users.push(user);
        }
        return users;
    }

    async getCommentsForPost(postId) {
        const flatComments = await this.getCommentsByPostId(postId, this.session);
        // console.log(
        //   flatComments.map((comment) => ({
        //     id: comment.id,
        //     parentId: comment.parentId,
        //   })),
        // );
        const tree = Comment.buildTree(flatComments);
        
        // console.log("TREE:", JSON.stringify(tree, null, 2));
        return tree;
    }   

  
    // Get user profile images
    async getImagePath({ id = -1, type = "undefined" } = {}) {
        // Create a unique key for the cache (e.g., "user_1")
        const cacheKey = `${type}_${id}`;
        

        if (this.imagePathCache[cacheKey]) {
            // Utils.log("ContentManager - Cache " + cacheKey + " already exists.")
            return this.imagePathCache[cacheKey];
        }
        try {
            // Utils.log("ContentManager - Caching " + cacheKey)
            const apiResponse = await fetch(`https://owres.org/roestack/${type}/${id}`);
            const result = await apiResponse.json();
            
            let images = [];
            if (result?.success && result.data?.images?.length > 0) {
                images = result.data.images;
            }

            // Store it
            this.imagePathCache[cacheKey] = images;
            return images;
        } catch (err) {
            console.error("Fetch failed:", err);
            return [];
        }
    }

      /**
       *  Load ALL comments for a post (flat)
       */
      async getCommentsByPostId(postId, session, sort = "best") {
        let orderBy = "";
    
        switch (sort) {
          case "latest":
            orderBy = "c.created_at DESC";
            break;
    
          case "oldest":
            orderBy = "c.created_at ASC";
            break;
    
          case "best":
          default:
            orderBy = "vote_count DESC, c.created_at DESC";
            break;
        }
    
        const sql = `
        SELECT c.id,
               COALESCE(SUM(v.positive * 2 - 1), 0) AS vote_count
        FROM comments c
        LEFT JOIN vote v ON v.comment_id = c.id
        WHERE c.post_id = ?
        GROUP BY c.id
        ORDER BY ${orderBy}
      `;
    
        const rows = await db.query(sql, [postId]);
    
        const comments = [];
    
        for (let row of rows) {
          const comment = await new Comment().load(row.id, this);
          comments.push(comment);
        }
    
        return comments;
      }
}

class Content {

    constructor(totalPosts, totalUsers, totalComments, mostHelpful, topCommunities,
            latestPosts, userList, communityList, popularPosts, session) {

        this.totalPosts = totalPosts;
        this.totalUsers = totalUsers;
        this.totalComments = totalComments;
        this.mostHelpful = mostHelpful;
        this.topCommunities = topCommunities;
        this.latestPosts = latestPosts; 
        this.userList = userList;
        this.communityList = communityList;
        this.popularPosts = popularPosts;
        this.session = session;
    
    }
}

// Add class to the exports, so that other classes can use it
module.exports = ContentManager;
