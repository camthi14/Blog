const ParentService = require("./parent.service");
const { _Category } = require("../models/category.model");
const CategoryService = require("./category.service");

class PostService extends ParentService {
  superCreate = this.create;
  superUpdate = this.update;
  superGetById = this.getById;
  superGetAll = this.getAll;

  create = (data) => {
    return new Promise(async (resolve, reject) => {
      try {
        const findTitle = await this.model
          .findOne({ title: data.title })
          .exec();

        if (findTitle) {
          return resolve({
            errors: {
              messagse: `Tiêu đề "${data.title}" đã tồn tại`,
            },
            status: 400,
          });
        }

        const response = await this.superCreate({
          ...data,
          category_id: data.categoryId,
          user_id: data.userId,
        });

        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  };

  update = ({ id, data }) => {
    return new Promise(async (resolve, reject) => {
      try {
        const findTitle = await this.model
          .findOne({ title: data.title })
          .select("_id")
          .exec();

        if (findTitle && findTitle._id.toString() !== id) {
          return resolve({
            errors: {
              messagse: `Tiêu đề "${data.title}" đã tồn tại`,
            },
            status: 400,
          });
        }

        const response = await this.superUpdate({
          id,
          data: { ...data, category_id: data.categoryId },
        });
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  };

  getById = (id, isPostModel = true) => {
    return this.superGetById(id, isPostModel);
  };

  getAll = (filters, isPostModel = true) => {
    return this.superGetAll(filters, isPostModel);
  };

  getBySlug = (slug) => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await this.model
          .findOne({
            slug: slug,
            is_delete: false,
          })
          .populate({
            path: "user_id",
            select: "full_name -_id",
          })
          .populate("category_id")
          .exec();

        if (!response) {
          return resolve({
            errors: {
              message: `Tiêu đề "${slug}" không tồn tại`,
            },
            status: 404,
            elements: null,
          });
        }

        const category = new CategoryService(_Category);
        const { elements } = await category.getById(
          response.category_id.parent_id
        );
        const { category_id, user_id, ...others } = response._doc;

        const result = {
          ...others,
          author: user_id.full_name || "Ẩn danh",
          category: {
            _id: category_id._id,
            name: category_id.name,
            slug: category_id.slug,
            parent: elements
              ? {
                  _id: elements._id,
                  name: elements.name,
                  slug: elements.slug,
                }
              : null,
          },
        };
        resolve({
          errors: null,
          status: 200,
          elements: result,
          meta: {
            message: "Lấy bài viết qua slug thành công!",
          },
        });
      } catch (error) {
        console.log("error", error);
        reject(error);
      }
    });
  };
}

module.exports = PostService;
